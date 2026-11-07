// Small shared helpers for the Worker: JSON replies, request bodies and the
// hashed client address used for rate limits (never stored raw).

export const MAX_BODY = 4 * 1024 * 1024; // 4 MB, the same ceiling the client enforces

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Replies depend on who is asking: never let a cache keep one.
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function fail(status, code, message) {
  return json({ error: code, message }, status);
}

export function nowIso() {
  return new Date().toISOString();
}

export function ipHash(request) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  return sha256Hex(ip);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The request body: JSON for API calls, and whatever `request.formData()` hands
 * back for uploads. Beacons arrive as text/plain, so a plain parse is tried too.
 */
export async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("multipart/form-data")) return request.formData();
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new Error("too_large");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * True when the request came from this same site, not from someone else's page.
 *
 * Compared against the Host header rather than the request URL: behind a dev
 * proxy (and at the edge) those differ, while Host is what the browser actually
 * addressed.
 */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetch and sendBeacon may omit it
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = request.headers.get("host") || new URL(request.url).host;
  if (originHost === host) return true;
  // Local development: the Vite dev server forwards /api to the Worker on
  // 127.0.0.1, so Host is the loopback address while Origin is the preview's.
  // Production hosts are never loopback, so this cannot widen the real check.
  return /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host);
}
