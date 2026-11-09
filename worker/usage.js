// How many packets a visitor may export before paying.
//
// Building is free and needs no server at all: files are read, arranged and
// previewed in the browser. Only a finished export asks for a packet, which is
// the moment this file is consulted. Once the allowance is gone the editor stays
// open; the export buttons are what stop working.
//
// "The same person" is deliberately not the IP address. Moving to another
// network, or clearing the browser, must not hand out a fresh free packet, so a
// record is resolved from several keys, strongest first:
//
//   1. the browser's own device id (X-Wron-Device, sent by the client kit)
//   2. a fingerprint of the headers a page cannot rewrite: user-agent,
//      sec-ch-ua, sec-ch-ua-platform, sec-ch-ua-mobile, accept-language
//   3. the shape of the packet being exported (its settings and file list), but
//      only when the browser build also matches — the same person reusing the
//      same template
//   4. the hashed address, kept as the weakest key and as evidence, never as the
//      only one
//
// KV holds the alias index (any of those keys -> one canonical id) and a small
// snapshot, because a lookup there is one fast read at the edge. R2 holds the
// record itself, including what was seen on each export: a KV eviction cannot
// lose the count, and the owner can read the evidence in the dashboard.
//
// Ceiling, stated plainly: the PDF is built in the browser, so this stops the
// ordinary reset (clear storage, new incognito window, new network). It does not
// stop somebody using a second browser or a second machine. Without accounts,
// nothing can.
import { fail, ipHash, json, nowIso, sha256Hex } from "./util.js";
import { roleFor } from "./owner.js";

/** Change this one number to change the free allowance. */
export const FREE_PACKETS = 3;

/** A re-export of the same packet inside this window is free, as the pricing page promises. */
const REVISION_DAYS = 7;

/** Enough history to see a pattern in the R2 record without it growing forever. */
const MAX_EXPORTS = 40;

const RECORD = (id) => `usage/${id}.json`;
const ALIAS = (kind, key) => `alias:${kind}:${key}`;
const CODE = (code) => `code:${code}`;
const SIG = /^[0-9a-f]{4,32}$/;

function readSignals(request) {
  const headers = request.headers;
  const pick = (name, max) => String(headers.get(name) || "").slice(0, max);
  return {
    ua: pick("user-agent", 300),
    uaCh: pick("sec-ch-ua", 300),
    platform: pick("sec-ch-ua-platform", 60),
    mobile: pick("sec-ch-ua-mobile", 10),
    lang: pick("accept-language", 120),
    device: pick("x-wron-device", 64),
  };
}

/** The browser build, without the language: a header set that barely drifts. */
async function browserHash(s) {
  return (await sha256Hex([s.ua, s.uaCh, s.platform, s.mobile].join("\u0001"))).slice(0, 24);
}

/** The whole header set: one browser on one machine. */
async function fingerprint(s) {
  return (await sha256Hex([s.ua, s.uaCh, s.platform, s.mobile, s.lang].join("\u0001"))).slice(0, 32);
}

async function readRecord(env, id) {
  if (!id) return null;
  const object = await env.FILES.get(RECORD(id));
  if (!object) return null;
  try {
    const record = await object.json();
    return record && typeof record === "object" ? record : null;
  } catch {
    return null;
  }
}

async function aliasTarget(env, kinds) {
  if (!env.KV) return null;
  for (const [kind, key] of kinds) {
    if (!key) continue;
    const id = await env.KV.get(ALIAS(kind, key));
    if (id) return id;
  }
  return null;
}

/** Claim a key for a record, but never move one that already points somewhere. */
async function claimAlias(env, kind, key, id) {
  if (!env.KV || !key) return;
  const slot = ALIAS(kind, key);
  if (await env.KV.get(slot)) return;
  await env.KV.put(slot, id);
}

async function findRecord(env, s, fp, sig) {
  const direct = await aliasTarget(env, [
    ["device", s.device],
    ["fp", fp],
  ]);
  const record = await readRecord(env, direct);
  if (record) return record;

  // No device and no header match. A packet of the same shape from the same
  // browser build is the same person reusing their template, so it counts as
  // theirs — but only with both signals, never the shape alone.
  if (sig && env.KV) {
    const bySig = await env.KV.get(ALIAS("sig", sig));
    const maybe = await readRecord(env, bySig);
    if (maybe && maybe.browser && maybe.browser === (await browserHash(s))) return maybe;
  }
  return null;
}

function blank(p, s, browser) {
  return {
    id: p.id,
    first: nowIso(),
    last: nowIso(),
    used: 0,
    credits: 0,
    browser,
    exports: [],
    seen: { ua: s.ua, platform: s.platform, lang: s.lang, device: s.device },
  };
}

/** A re-export of a packet already exported inside the window is not another packet. */
function isRevision(record, sig) {
  if (!sig) return false;
  const since = Date.now() - REVISION_DAYS * 86_400_000;
  return (record.exports || []).some((e) => e.sig === sig && !e.denied && Date.parse(e.at) > since);
}

function view(record, sig) {
  const used = Number(record?.used || 0);
  const credits = Number(record?.credits || 0);
  const remaining = Math.max(0, FREE_PACKETS - used) + credits;
  return {
    allowed: remaining > 0 || (record ? isRevision(record, sig) : false),
    free: FREE_PACKETS,
    used,
    credits,
    remaining,
  };
}

async function save(env, record, s, fp, ip, sig) {
  record.last = nowIso();
  record.exports = (record.exports || []).slice(0, MAX_EXPORTS);
  await env.FILES.put(RECORD(record.id), JSON.stringify(record), {
    httpMetadata: { contentType: "application/json" },
  });
  if (env.KV) {
    await claimAlias(env, "device", s.device, record.id);
    await claimAlias(env, "fp", fp, record.id);
    await claimAlias(env, "ip", ip, record.id);
    if (sig) await claimAlias(env, "sig", sig, record.id);
    try {
      await env.KV.put(
        `use:${record.id}`,
        JSON.stringify({ used: record.used, credits: record.credits, last: record.last }),
      );
    } catch (err) {
      console.error("usage snapshot failed:", err && err.message ? err.message : err);
    }
  }
}

export async function handleUsage(request, env, body) {
  if (!env.FILES) return fail(503, "not_connected", "This site is not connected to its file storage yet.");

  // Decided here, from the session cookie, before anything is counted.
  const role = await roleFor(request, env);
  const op = String(body.op || "status");
  const s = readSignals(request);
  const ip = await ipHash(request);
  const fp = await fingerprint(s);
  const sig = SIG.test(String(body.sig || "")) ? String(body.sig) : "";
  const pages = Math.max(0, Math.min(100_000, Math.round(Number(body.pages) || 0)));

  if (op === "status") {
    const record = await findRecord(env, s, fp, sig);
    const state = view(record, sig);
    return json(role === "owner" ? { ...state, role, allowed: true } : { ...state, role });
  }

  if (op === "redeem") {
    const code = String(body.code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 64);
    if (code.length < 4) return fail(400, "invalid_code", "That code is not valid. Check it and try again.");
    if (!env.KV) return fail(503, "not_connected", "Codes are not connected on this site yet.");

    const raw = await env.KV.get(CODE(code));
    if (!raw) return fail(404, "invalid_code", "That code is not valid, or it has already been used.");
    let packets = 0;
    try {
      const parsed = JSON.parse(raw);
      packets = Math.round(Number(parsed && typeof parsed === "object" ? parsed.packets : parsed));
    } catch {
      packets = Math.round(Number(raw));
    }
    if (!Number.isFinite(packets) || packets < 1) {
      return fail(400, "invalid_code", "That code is not valid. Check it and try again.");
    }
    packets = Math.min(1_000, packets);

    const browser = await browserHash(s);
    const record = (await findRecord(env, s, fp, sig)) || blank({ id: fp }, s, browser);
    record.credits = Number(record.credits || 0) + packets;
    await save(env, record, s, fp, ip, sig);
    await env.KV.delete(CODE(code));
    return json({ ...view(record, sig), added: packets });
  }

  if (op !== "consume") return fail(400, "unknown_op", "Unknown usage request.");

  const browser = await browserHash(s);
  const record = (await findRecord(env, s, fp, sig)) || blank({ id: fp }, s, browser);

  const entry = { at: nowIso(), sig, pages, ip };
  let reason = "revision";

  if (role === "owner") {
    // Recorded, never counted: the owner's exports do not spend the allowance.
    entry.owner = true;
    record.exports = [entry, ...(record.exports || [])];
    await save(env, record, s, fp, ip, sig);
    return json({ ...view(record, sig), role, owner: true, allowed: true, reason: "owner" });
  }

  if (isRevision(record, sig)) {
    entry.revision = true;
  } else if (Number(record.credits || 0) > 0) {
    record.credits = Number(record.credits) - 1;
    reason = "credit";
  } else if (Number(record.used || 0) < FREE_PACKETS) {
    record.used = Number(record.used || 0) + 1;
    reason = "free";
  } else {
    // Refused: still recorded, so a run of attempts is visible in the evidence.
    entry.denied = true;
    record.exports = [entry, ...(record.exports || [])];
    await save(env, record, s, fp, ip, sig);
    return json({ ...view(record, sig), role, allowed: false, reason: "payment_required" });
  }

  record.exports = [entry, ...(record.exports || [])];
  await save(env, record, s, fp, ip, sig);
  return json({ ...view(record, sig), role, allowed: true, reason });
}
