// Contact forms, kept in D1: SELECT * FROM form_submissions in the dashboard.
//
// The pack-request form is how a visitor asks for packets and pays by Cash App,
// so an entry must land somewhere the owner can read. Rows carry the form name,
// the fields and a hashed address (never the address itself), plus a per-address
// daily cap so one person cannot fill the table.
import { fail, ipHash, json, nowIso } from "./util.js";

const DAILY_LIMIT = 20;
const MAX_FIELD = 5_000;

function clean(data) {
  const out = {};
  for (const [key, raw] of Object.entries(data || {})) {
    if (!/^[A-Za-z0-9_ -]{1,40}$/.test(key)) continue;
    out[key] = (raw == null ? "" : String(raw)).slice(0, MAX_FIELD);
  }
  return out;
}

export async function handleForms(request, env, body) {
  if (!env.DB) return fail(503, "not_connected", "This site is not connected to its database yet.");

  const form = String(body.form || "form").slice(0, 80);
  const data = clean(body.data);
  // The honeypot the kit renders is empty for people and filled by bots.
  if (data._gotcha) return json({ ok: true, sent: true });

  const hashed = await ipHash(request);
  const day = nowIso().slice(0, 10);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM form_submissions WHERE ip_hash = ? AND created_at >= ?")
    .bind(hashed, `${day}T00:00:00.000Z`)
    .first();
  if (Number(recent?.n || 0) >= DAILY_LIMIT) {
    return fail(429, "too_many", "That is a lot of requests for one day. Please email us instead.");
  }

  await env.DB.prepare("INSERT INTO form_submissions (id, form, data, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), form, JSON.stringify(data).slice(0, 100_000), hashed, nowIso())
    .run();

  return json({ ok: true, sent: true });
}
