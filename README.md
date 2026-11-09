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

## The free packet

`worker/usage.js` holds the allowance: `FREE_PACKETS`, currently **3**. Anyone whose
record predates `TRIAL_GREW_AT` keeps the single packet they were promised. Adding,
arranging and previewing never touch the server — the editor stays open — and only
a finished export asks for a packet.

The count is kept server-side, so clearing the browser, opening a private window or
changing networks does not hand out another free packet. A person is resolved from
the browser's device id, a fingerprint of the headers a page cannot rewrite, the
shape of the packet being exported, and the hashed address last — never the IP
alone. KV holds the alias index (one fast read at the edge); R2 holds
`usage/<id>.json` per person, with every export and every refusal recorded, so the
evidence outlives any KV eviction.

A re-export of the same packet within seven days is free, as the pricing page says.

The ceiling is worth knowing: the PDF is built in the browser, so this stops the
ordinary reset. Somebody using a second browser or machine is a different record.

### Letting a buyer export after paying

Issue a code, one per paid packet, from the dashboard (KV → the namespace in
`wrangler.jsonc` → add key `code:EXHIBITZ-AB12`) or from the command line:

    npx wrangler kv key put --binding KV --remote "code:EXHIBITZ-AB12" '{"packets":1}'

Send it to the buyer; they enter it in the export step and the code is deleted as
soon as it is used. `{"packets":20}` adds twenty.

### Letting the payment issue the code itself

Cash App has no webhook for money arriving on a personal account, so the *alert* is the
trigger: the receipt email, or the phone's own notification, is handed to an automation
which posts the payment to `POST /api/pay/received`. `worker/pay.js` answers with a real
packet code — the same kind as above — for the automation to send on to the buyer.

Set one secret first; nothing is issued without it:

    npx wrangler secret put PAY_NOTIFY_KEY       # a long random string the automation sends back

Then point any automation at it. Zapier (email parser → filter → webhook), n8n (IMAP or
Gmail trigger → HTTP request), an Apps Script on the inbox, or a service like
emailreceipts.io that forwards receipts and posts a webhook — all send the same thing:

    curl -X POST https://ezxhibitz.ai-n.workers.dev/api/pay/received \
      -H "x-pay-key: THE-KEY" -H "content-type: application/json" \
      -d '{"amount":"7.99","note":"buyer@example.com","id":"cash-app-reference"}'

The reply is `{"ok":true,"code":"PACKET-XXXXXXXXXXXX","packets":1,"email":"buyer@example.com"}`.
Add a step that emails `code` to `email` and the buyer is served without anyone touching
it. A `Bearer` token is accepted instead of `x-pay-key`, and `amount` may be `7.99` or
`"$7.99"`. A payment under the packet price is refused, so a $1 test payment mints
nothing.

The details that matter:

- **One payment, one code.** Send the Cash App reference as `id`. A retry returns the same
  code with `"duplicate":true` instead of selling a second packet. Without an `id`, the
  same payer paying the same amount on the same day counts as one payment.
- **The buyer's address** comes from `email`, or from the email the buyer typed in the
  Cash App note, which is why the purchase dialog asks them to put it there. With no
  address the code is still issued, `needs_email` is `true`, and it is up to the
  automation to reach the owner instead of the buyer.
- **Codes expire in 90 days** and are single use, like every other code.
- **Test it without money:** post a fake payment with a made-up `id`; a code comes back
  and redeems in the export step. Delete that `code:` key afterwards if you do not want
  it live.
- Before trusting a real receipt, check what your notification actually contains — the
  amount and the note are not guaranteed in every Cash App alert. If the note is missing,
  the payment still mints a code and the request form is how you learn who to send it to.

## Owner access

The owner uses the product without paying, and their exports are not counted. That is a
`role`, not a plan: `role` is `owner` or `customer`, decided only by the Worker, and it
sits beside `plan` rather than replacing it.

Two secrets must be set before anyone can sign in:

    npx wrangler secret put OWNER_ACCESS_CODE     # the code the owner types
    npx wrangler secret put OWNER_SESSION_KEY     # a long random string; signs the cookie

`OWNER_ACCESS_CODE` is the credential: generate it once, keep it out of the repository,
and change it to revoke access. `OWNER_SESSION_KEY` signs the session cookie, so rotating
it signs every owner out. Neither value belongs in `wrangler.jsonc`, in a commit, or in a
message. For local `npm run api`, put both names in `.dev.vars`, which is ignored.

The owner signs in on the Export step: **Owner sign in**, then the code. The code is sent
once in `X-Owner-Code` and exchanged for a 30-day `HttpOnly; Secure; SameSite=Lax`
cookie; it is never stored in the page, and no visitor is recognised by IP or user agent.
The badge appears only when the server reports `role: "owner"`, and signing out brings
the free-packet allowance back exactly as it was.

With either secret missing the route fails closed with `401`, so a half-configured
deployment is not an open one.

    node --test test/owner.test.mjs     # the owner checks, no Cloudflare needed
