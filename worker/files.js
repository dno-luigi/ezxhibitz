// Share links: the exported packet is stored in R2 and served from this Worker at
// /f/<id>, so the link keeps working with no third-party file host.
//
// Files disappear 30 days after they are made (the same window the site's copy
// promises): the date rides along as R2 metadata and is checked on every read, so
// an expired packet is deleted rather than merely hidden.
import { fail, ipHash, json, nowIso } from "./util.js";

const MAX_UPLOAD = 4 * 1024 * 1024; // matches UPLOAD_MAX in the client kit
const EXPIRY_DAYS = 30;
const DAILY_LIMIT = 20;

/** Only files this product makes: a packet PDF, or a picture added to one. */
const TYPES = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const KEY = (id) => `share/${id}`;

export async function handleUpload(request, env) {
  if (!env.FILES) return fail(503, "not_connected", "File sharing is not connected on this site yet.");
  if (!env.DB) return fail(503, "not_connected", "This site is not connected to its database yet.");

  const form = await request.formData().catch(() => null);
  const file = form ? form.get("file") : null;
  if (!file || typeof file === "string") return fail(400, "no_file", "Pick a file first.");
  if (file.size > MAX_UPLOAD) return fail(413, "too_large", "That file is over 4 MB.");
  const type = String(file.type || "").toLowerCase();
  if (!TYPES[type]) return fail(415, "unsupported", "Only PDF and image files can be shared.");

  const hashed = await ipHash(request);
  const day = nowIso().slice(0, 10);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM uploads WHERE ip_hash = ? AND created_at >= ?")
    .bind(hashed, `${day}T00:00:00.000Z`)
    .first();
  if (Number(recent?.n || 0) >= DAILY_LIMIT) {
    return fail(429, "too_many", "That is a lot of uploads for one day. Please try again tomorrow.");
  }

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString();
  const name = String(file.name || `packet.${TYPES[type]}`).slice(0, 120);
  await env.FILES.put(KEY(id), await file.arrayBuffer(), {
    httpMetadata: { contentType: type },
    customMetadata: { name, expires_at: expiresAt },
  });
  await env.DB.prepare("INSERT INTO uploads (id, file_name, size, ip_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, name, file.size, hashed, nowIso(), expiresAt)
    .run();

  return json({ url: `${new URL(request.url).origin}/f/${id}`, name, expires_at: expiresAt });
}

/** GET /f/<id>: the stored packet, or a plain "gone" answer. */
export async function serveFile(request, env, id) {
  if (!env.FILES) return fail(503, "not_connected", "File sharing is not connected on this site yet.");

  const object = await env.FILES.get(KEY(id));
  if (!object) return fail(404, "not_found", "This link is no longer available.");

  const expiresAt = object.customMetadata?.expires_at || "";
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    await env.FILES.delete(KEY(id));
    return fail(410, "expired", "This link has expired. Ask for a new one.");
  }

  const name = (object.customMetadata?.name || "packet.pdf").replace(/["\\\r\n]/g, "");
  const headers = {
    "content-type": object.httpMetadata?.contentType || "application/octet-stream",
    "content-disposition": `inline; filename="${name}"`,
    "cache-control": "private, max-age=0, must-revalidate",
    // A shared packet is for the person holding the link, not for search results.
    "x-robots-tag": "noindex, nofollow",
  };
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
