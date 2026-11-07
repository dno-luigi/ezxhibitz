// D1 schema bootstrap.
//
// The deploy that runs on push provisions the database itself, but a brand-new
// database has no tables. Instead of requiring `wrangler d1 migrations apply`
// after the first deploy, the Worker applies the same SQL as
// migrations/0001_init.sql the first time it finds the tables missing.
//
// The statements are all `IF NOT EXISTS`, so two isolates racing on the first
// request both succeed. The check runs once per isolate, not per request.
import schemaSql from "../migrations/0001_init.sql";

// The file is for humans (comments, blank lines) and for `wrangler d1 migrations`.
// D1 wants one prepared statement at a time, so split it into individual ones.
const STATEMENTS = schemaSql
  .replace(/^\s*--.*$/gm, "")
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

let ready;

export function ensureSchema(env) {
  if (!env.DB) return Promise.resolve();
  ready ??= (async () => {
    const table = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'uploads'",
    ).first();
    if (!table) await env.DB.batch(STATEMENTS.map((sql) => env.DB.prepare(sql)));
  })().catch((err) => {
    ready = undefined; // retry on the next request instead of caching the failure
    throw err;
  });
  return ready;
}
