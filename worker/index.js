// Cloudflare backend for EZ EXHIBITZ.
//
// The app's bundled client kit (src/wron-kit/cloud.js) was written against a
// hosted backend at /api/site/<siteId>/<action>. This Worker serves that same
// contract from this site's own Cloudflare account, so the pack-request form,
// share links and beacons stay in our own ecosystem instead of going to wron.ai:
//
//   POST /api/site/:siteId/forms   { form, data }            -> form_submissions
//   POST /api/site/:siteId/db      { op, table, values }     -> share_links
//   POST /api/site/:siteId/upload  multipart "file"          -> stored in R2
//   GET  /f/:id                                              -> the shared file
//   POST /api/site/:siteId/hit | errors                      -> accepted, not stored
//
// Anything else falls through to the built single-page app in ./dist.
import { handleDb } from "./db.js";
import { handleUpload, serveFile } from "./files.js";
import { handleForms } from "./forms.js";
import { ensureSchema } from "./schema.js";
import { fail, readBody, sameOrigin } from "./util.js";

const ACTION = /^\/api\/site\/([A-Za-z0-9_-]{1,64})\/([a-z]+)\/?$/;
const FILE = /^\/f\/([A-Za-z0-9-]{8,64})\/?$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const file = FILE.exec(url.pathname);
    if (file) {
      if (request.method !== "GET" && request.method !== "HEAD") return fail(405, "method_not_allowed", "Use GET.");
      return serveFile(request, env, file[1]);
    }

    const match = ACTION.exec(url.pathname);
    if (!match) {
      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return fail(404, "not_found", "No such endpoint.");
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") return fail(405, "method_not_allowed", "Use POST.");
    // Someone else's page may not post here on a visitor's behalf.
    if (!sameOrigin(request)) return fail(403, "not_allowed", "Requests must come from this site.");

    const action = match[2];
    // Cheap beacons need no body and no storage, and must never make a page error.
    if (action === "hit" || action === "errors") return new Response(null, { status: 204 });

    // A database that was just provisioned starts empty; give it its tables.
    try {
      await ensureSchema(env);
    } catch (err) {
      console.error("schema bootstrap failed:", err && err.stack ? err.stack : err);
      return fail(500, "server_error", "The database could not be prepared. Please try again.");
    }

    try {
      // An upload's body is the file itself: the handler reads it, once.
      if (action === "upload") return await handleUpload(request, env);

      let body;
      try {
        body = await readBody(request);
      } catch {
        return fail(413, "too_large", "That request is too large.");
      }

      switch (action) {
        case "forms":
          return await handleForms(request, env, body);
        case "db":
          return await handleDb(request, env, body);
        case "auth":
          return fail(501, "not_supported", "This site has no accounts. Pay per packet or by plan, no sign-in needed.");
        case "ai":
        case "checkout":
        case "appointments":
          return fail(501, "not_supported", `"${action}" is not part of this site's backend.`);
        default:
          return fail(501, "not_supported", `"${action}" is not part of this site's backend.`);
      }
    } catch (err) {
      console.error(`${action} failed:`, err && err.stack ? err.stack : err);
      return fail(500, "server_error", "Something went wrong on the server. Please try again.");
    }
  },
};
