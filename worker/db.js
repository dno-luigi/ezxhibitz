// The "share_links" table from db/schema.json, implemented on D1.
//
// The schema declares `access: "submit"`: anyone may add a row, nobody may read
// the table back. That is what the app needs — an exported packet's URL is handed
// straight to the visitor who made it, never listed for strangers — so listing,
// updating and removing are refused here rather than quietly allowed.
//
// Column names never come from the request: only the names in COLUMNS can reach
// the SQL, and every value is bound as a parameter.
import { fail, ipHash, json, nowIso } from "./util.js";

const TABLE = "share_links";

const COLUMNS = {
  url: "text",
  file_name: "text",
  page_count: "number",
  action: "text",
  remove_by: "text",
};

function pick(values) {
  const out = {};
  for (const [key, raw] of Object.entries(values || {})) {
    const type = COLUMNS[key];
    if (!type) continue;
    if (type === "number") {
      const number = Number(raw);
      if (Number.isFinite(number)) out[key] = Math.max(0, Math.min(100_000, Math.round(number)));
    } else {
      out[key] = raw == null ? null : String(raw).slice(0, 2000);
    }
  }
  return out;
}

/** Share links must point at files this Worker served; a row is not a link shortener. */
function isOwnFile(url, request) {
  try {
    const parsed = new URL(String(url), request.url);
    return parsed.origin === new URL(request.url).origin && parsed.pathname.startsWith("/f/");
  } catch {
    return false;
  }
}

export async function handleDb(request, env, body) {
  if (String(body.table || "") !== TABLE) return fail(404, "unknown_table", "That table is not available on this site.");

  const op = String(body.op || "list");
  if (op !== "add") {
    // Deliberately unavailable: the table is write-only for visitors.
    return fail(403, "not_allowed", "Share links can be created but not listed.");
  }
  if (!env.DB) return fail(503, "not_connected", "This site is not connected to its database yet.");

  const values = pick(body.values);
  if (!values.url) return fail(400, "missing_url", "A share link needs a file.");
  if (!isOwnFile(values.url, request)) return fail(400, "invalid_url", "That link does not belong to this site.");
  if (!values.action) values.action = "created";

  const row = { id: crypto.randomUUID(), ...values, created_at: nowIso(), ip_hash: await ipHash(request) };
  const keys = Object.keys(row);
  await env.DB.prepare(`INSERT INTO ${TABLE} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`)
    .bind(...Object.values(row))
    .run();

  // The visitor is told what they need; the address they used stays server-side.
  return json({ row: { id: row.id, url: row.url, file_name: row.file_name, page_count: row.page_count, action: row.action, remove_by: row.remove_by, created_at: row.created_at } });
}
