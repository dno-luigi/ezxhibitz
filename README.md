# EZ EXHIBITZ

The packet builder that goes where you do: add PDFs, images and Word files, arrange
exhibits, export one clean PDF.

    npm install
    npm run dev      # http://localhost:5173  (app only)
    npm run api      # http://localhost:8787  (built app + its backend)
    npm run build    # static files in dist/, ready for any host

Every page is in `src/pages`, shared parts in `src/components`, and the design tokens
(colors, fonts, radius) in `site.json` and `tailwind.config.js`.

## Backend

Forms, share links and packet uploads are served by this site's own Worker
(`worker/`) on Cloudflare, so nothing leaves our own account:

| Route                              | What it does                                    |
| ---------------------------------- | ----------------------------------------------- |
| `POST /api/site/ezxhibitz/forms`   | Stores a pack request in `form_submissions`     |
| `POST /api/site/ezxhibitz/db`      | Adds a row to `share_links` (write-only)        |
| `POST /api/site/ezxhibitz/upload`  | Stores a packet in R2, returns `/f/<id>`        |
| `GET  /f/<id>`                     | Serves a shared packet; deleted after 30 days   |
| `POST .../hit`, `POST .../errors`  | Beacons: accepted and not stored                |

The browser reaches them through the site's own origin — `window.__WRON__` in
`index.html` sets `api` to `location.origin`. The client kit in `src/wron-kit/` is
unchanged apart from that.

### Local

    npm run db:migrate:local   # create the local D1 tables
    npm run api                # workerd, local D1 + local R2

`wrangler.local.jsonc` holds the local bindings; state lives in `.wrangler/`.

### Going live

Push. The Worker is connected to GitHub, so the build that runs on push builds
`dist/` and deploys.

`wrangler.jsonc` declares the bindings with no resource IDs on purpose. Wrangler
4.45+ provisions on deploy, so that same push creates the `ezxhibitz` D1 database
and the `ezxhibitz-files` R2 bucket (if R2 is enabled on the account), links them
to the Worker, and writes their IDs back into its own build copy. Nothing here
needs a pasted `database_id`, and future pushes keep the same resources.

A newly created database is empty, so `worker/schema.js` applies
`migrations/0001_init.sql` on its first request after deploy (all statements are
`IF NOT EXISTS`, once per isolate). No `d1 migrations apply` step is required.

To turn provisioning off for a policy-sensitive account, add `--no-x-provision`
to the deploy command in the Workers Builds settings.

To read the inbox:

    npx wrangler d1 execute ezxhibitz --remote --command "SELECT * FROM form_submissions ORDER BY created_at DESC"
