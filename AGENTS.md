# AGENTS.md

Read this before changing anything in this repository.

EZ EXHIBITZ is subordinate to `mind` (`dno-luigi/mind`), which is the authority for
brand, secrets, model roles and standards. The rules in that repository's `AGENTS.md`
apply here as well; its `docs/MIND-AUTHORITY.md` is the charter. This file records only
what is specific to this project, and only invariants: if a fact can change without
anyone editing this file, it does not belong here.

## What this is

A packet builder: the front end in `src/` (React + Vite) and the API in `worker/`, served
from one origin on Cloudflare. The browser reaches the API through `location.origin`.

## Owner entitlement

- **Two axes.** `role` (`owner` | `customer`) is separate from `plan`. The owner is not an
  admin, and nothing in this repository grants admin rights.
- **The server decides the role.** `worker/owner.js` (`roleFor`) is the only place that
  answers "is this the owner". `src/lib/owner.js` carries the request and reports the
  answer; it never decides anything, and `ExportStage` only renders what the server said.
- **The code is exchanged, not kept.** It arrives in `X-Owner-Code`, is compared after
  hashing both sides to equal-length digests, and becomes an HMAC-signed `HttpOnly;
  Secure; SameSite=Lax` cookie (`ezx_owner`). Nothing is bound to an IP or a user agent,
  and nothing is written to page storage.
- **An owner export is recorded, never counted.** `used` and `credits` do not move.
- **Five wrong codes per source per minute, then `429`.** A wrong code is a `401` with one
  generic message.
- **Fail closed.** With `OWNER_ACCESS_CODE` or `OWNER_SESSION_KEY` unset, the route
  answers `401` and nobody is an owner.
- **Secrets by name only:** `OWNER_ACCESS_CODE`, `OWNER_SESSION_KEY`. Never echo, log,
  commit or paste a value. Locally they belong in `.dev.vars`, which is ignored.
- **Verify:** `node --test test/owner.test.mjs`, then `npm run build`.

## Checks

    npm ci
    npm run build
    node --test test/owner.test.mjs
