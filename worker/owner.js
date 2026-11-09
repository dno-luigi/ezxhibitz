// Owner entitlement for EZ EXHIBITZ.
//
// A role, kept apart from the plan. `plan` is what someone bought (free, personal,
// professional, founder); `role` is whether this browser proved it holds the owner
// credential. Only the role lifts the commercial gates, and only the server decides
// it — the page may show a badge, never grant itself one.
//
// The code is exchanged once for a signed session, so the code itself is not sent
// on every request and cannot reach a referrer or an access log. Nothing in the
// session is bound to an address or a user agent: moving networks or changing
// browsers must not lock the owner out, and the code is the recovery path.
//
//   POST   /api/owner/session   code in the X-Owner-Code header -> sets the cookie
//   GET    /api/owner/session                                    -> { role }
//   DELETE /api/owner/session                                    -> clears it
//
// Secrets, set by the owner with `wrangler secret put`:
//   OWNER_ACCESS_CODE   the code, at least 32 bytes of entropy
//   OWNER_SESSION_KEY   the HMAC key that signs sessions, separate so sessions can
//                       be invalidated without changing the code
import { fail, ipHash, json, sha256Hex } from "./util.js";

export const COOKIE = "ezx_owner";
export const VERSION = 1;

/** 30 days, in seconds. Long enough to be invisible, short enough to expire. */
const MAX_AGE = 30 * 24 * 60 * 60;

/** Failed attempts per source inside the window, and the window itself. */
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW = 60;

const HEADER = "x-owner-code";
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function hmacKey(env) {
  const secret = String(env?.OWNER_SESSION_KEY || "");
  if (!secret) return null;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/** A signed claim, or null when no session key is configured. */
export async function signClaim(env, claim) {
  const key = await hmacKey(env);
  if (!key) return null;
  const body = b64url(enc.encode(JSON.stringify(claim)));
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return `${body}.${b64url(new Uint8Array(mac))}`;
}

/** The claim behind a token, or null. Signature first, then version, then expiry. */
export async function verifyClaim(env, token) {
  const key = await hmacKey(env);
  if (!key || typeof token !== "string" || !token) return null;
  const split = token.split(".");
  if (split.length !== 2 || !split[0] || !split[1]) return null;
  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", key, unb64url(split[1]), enc.encode(split[0]));
  } catch {
    return null;
  }
  if (!valid) return null;
  let claim;
  try {
    claim = JSON.parse(dec.decode(unb64url(split[0])));
  } catch {
    return null;
  }
  if (!claim || claim.role !== "owner") return null;
  if (Number(claim.v) !== VERSION) return null;
  if (!Number.isFinite(claim.exp) || claim.exp * 1000 <= Date.now()) return null;
  return claim;
}

/**
 * Compare a supplied code to the stored one without a timing signal.
 *
 * Both sides are hashed first, so the comparison is over equal-length hex and the
 * length of the real code cannot be narrowed from response times.
 *
 * Both sides are trimmed first. A secret written with `echo code | wrangler secret
 * put` keeps the newline, and a value a human types never does, so an untrimmed
 * stored code is a code nobody can ever sign in with.
 */
async function codeMatches(env, provided) {
  const expected = String(env?.OWNER_ACCESS_CODE || "").trim();
  provided = String(provided || "").trim();
  if (!expected || !provided) return false;
  const a = await sha256Hex(`owner-code:${expected}`);
  const b = await sha256Hex(`owner-code:${provided}`);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sessionCookie(token) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return "";
}

/** The only place a role is decided. Everything else asks this. */
export async function roleFor(request, env) {
  if (!env?.OWNER_ACCESS_CODE || !env?.OWNER_SESSION_KEY) return "customer";
  const token = readCookie(request, COOKIE);
  if (!token) return "customer";
  const claim = await verifyClaim(env, token);
  return claim ? "owner" : "customer";
}

export async function handleOwner(request, env) {
  if (request.method === "GET") return json({ role: await roleFor(request, env) });

  if (request.method === "DELETE") {
    return json({ role: "customer" }, 200, { "set-cookie": clearCookie() });
  }
  if (request.method !== "POST") return fail(405, "method_not_allowed", "Use GET, POST or DELETE.");

  // Fail closed and say nothing about which secret is missing — an unconfigured
  // site must not become an open one, nor advertise that owner access exists.
  if (!env?.OWNER_ACCESS_CODE || !env?.OWNER_SESSION_KEY) {
    return fail(401, "not_owner", "That code is not valid.");
  }

  const provided = String(request.headers.get(HEADER) || "").trim();
  const ip = await ipHash(request);
  const bucket = `owner:try:${ip}`;
  const tries = env.KV ? Number(await env.KV.get(bucket)) || 0 : 0;
  if (env.KV && tries >= ATTEMPT_LIMIT) {
    // A lockout is not a wrong code, so it says so and names the wait: the caller
    // shows this message verbatim instead of "that code is not valid".
    return json(
      { error: "too_many_attempts", message: `Too many attempts. Wait ${ATTEMPT_WINDOW} seconds, then try again.` },
      429,
      { "retry-after": String(ATTEMPT_WINDOW) },
    );
  }

  if (!(await codeMatches(env, provided))) {
    if (env.KV) await env.KV.put(bucket, String(tries + 1), { expirationTtl: ATTEMPT_WINDOW });
    return fail(401, "not_owner", "That code is not valid.");
  }

  if (env.KV) await env.KV.delete(bucket);
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const token = await signClaim(env, { role: "owner", v: VERSION, exp });
  if (!token) return fail(401, "not_owner", "That code is not valid.");
  return json({ role: "owner", exp }, 200, { "set-cookie": sessionCookie(token) });
}
