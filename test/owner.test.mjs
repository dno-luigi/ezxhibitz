// The owner entitlement: the server decides the role, and the page only reports it.
//
//   node --test test/owner.test.mjs
//
// Nothing here needs Cloudflare. The Worker handlers are plain functions, the stores
// are Maps, and the client library is driven through a stubbed fetch.
import assert from "node:assert/strict";
import test from "node:test";

import { handleOwner, signClaim } from "../worker/owner.js";
import { handleUsage } from "../worker/usage.js";
import { owner } from "../src/lib/owner.js";

const CODE = "TEST-CODE-0123456789abcdef0123456789abcdef";
const KEY = "test-session-key-0000000000000000";

function memKV() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
  };
}

function memR2() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? { json: async () => JSON.parse(m.get(k)) } : null),
    put: async (k, v) => void m.set(k, String(v)),
  };
}

const newEnv = () => ({ OWNER_ACCESS_CODE: CODE, OWNER_SESSION_KEY: KEY, KV: memKV(), FILES: memR2() });
const ownerReq = (headers = {}, method = "POST") =>
  new Request("https://ezxhibitz.test/api/owner/session", { method, headers });
const usageReq = (headers = {}) =>
  new Request("https://ezxhibitz.test/api/site/ezxhibitz/usage", { method: "POST", headers });

const setCookie = (res) => String(res.headers.get("set-cookie") || "");
const sessionOf = (res) => setCookie(res).split(";")[0];

async function signedIn(env) {
  const res = await handleOwner(ownerReq({ "x-owner-code": CODE }), env);
  assert.equal(res.status, 200);
  return sessionOf(res);
}

test("a wrong code is refused, and sets no cookie", async () => {
  const res = await handleOwner(ownerReq({ "x-owner-code": "not-the-code" }), newEnv());
  assert.equal(res.status, 401);
  assert.equal(setCookie(res), "");
  assert.match((await res.json()).message, /not valid/i);
});

test("the right code returns a session cookie with the hardened attributes", async () => {
  const res = await handleOwner(ownerReq({ "x-owner-code": CODE }), newEnv());
  assert.equal(res.status, 200);
  const cookie = setCookie(res);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /^ezx_owner=/);
  const body = await res.json();
  assert.equal(body.role, "owner");
  assert.equal(typeof body.exp, "number");
});

test("a session reports the owner role", async () => {
  const env = newEnv();
  const session = await signedIn(env);
  const res = await handleOwner(ownerReq({ cookie: session }, "GET"), env);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).role, "owner");
});

test("a tampered signature is only a customer", async () => {
  const env = newEnv();
  const session = await signedIn(env);
  const parts = session.split("=");
  const [claim, sig] = parts[1].split(".");
  const tampered = `${parts[0]}=${claim}.${sig.slice(0, -2)}${sig.endsWith("aa") ? "bb" : "aa"}`;
  const res = await handleOwner(ownerReq({ cookie: tampered }, "GET"), env);
  assert.equal((await res.json()).role, "customer");
});

test("an old claim version is only a customer", async () => {
  const env = newEnv();
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = await signClaim(env, { role: "owner", v: 2, exp });
  const res = await handleOwner(ownerReq({ cookie: `ezx_owner=${token}` }, "GET"), env);
  assert.equal((await res.json()).role, "customer");
});

test("an expired session is only a customer", async () => {
  const env = newEnv();
  const token = await signClaim(env, { role: "owner", v: 1, exp: Math.floor(Date.now() / 1000) - 5 });
  const res = await handleOwner(ownerReq({ cookie: `ezx_owner=${token}` }, "GET"), env);
  assert.equal((await res.json()).role, "customer");
});

test("the sixth wrong attempt in a minute is rate limited, and says so", async () => {
  const env = newEnv();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await handleOwner(ownerReq({ "x-owner-code": "wrong" }), env)).status, 401);
  }
  const limited = await handleOwner(ownerReq({ "x-owner-code": "wrong" }), env);
  assert.equal(limited.status, 429);
  const body = await limited.json();
  assert.equal(body.error, "too_many_attempts");
  assert.match(body.message, /too many attempts/i);
});

test("with no secrets configured the route fails closed", async () => {
  const env = { KV: memKV(), FILES: memR2() };
  const res = await handleOwner(ownerReq({ "x-owner-code": CODE }), env);
  assert.equal(res.status, 401);
});

test("a stored code with a stray newline still signs in", async () => {
  // `echo code | wrangler secret put` keeps the newline; a typed code never has one.
  const env = { ...newEnv(), OWNER_ACCESS_CODE: `${CODE}\n` };
  const res = await handleOwner(ownerReq({ "x-owner-code": CODE }), env);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).role, "owner");
});

test("a lockout names the wait and carries retry-after", async () => {
  const env = newEnv();
  for (let i = 0; i < 5; i += 1) await handleOwner(ownerReq({ "x-owner-code": "wrong" }), env);
  const limited = await handleOwner(ownerReq({ "x-owner-code": "wrong" }), env);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");
  assert.match((await limited.json()).message, /wait 60 seconds/i);
});

test("a customer gets one free export, then is refused", async () => {
  const env = newEnv();
  const first = await (await handleUsage(usageReq(), env, { op: "consume", sig: "abc123", pages: 2 })).json();
  const second = await (await handleUsage(usageReq(), env, { op: "consume", sig: "def456", pages: 2 })).json();
  assert.equal(first.allowed, true);
  assert.equal(first.reason, "free");
  assert.equal(first.role, "customer");
  assert.equal(second.allowed, false);
  assert.equal(second.reason, "payment_required");
});

test("an owner export is recorded but never counted", async () => {
  const env = newEnv();
  const session = await signedIn(env);
  const first = await (await handleUsage(usageReq({ cookie: session }), env, { op: "consume", sig: "0aa111", pages: 2 })).json();
  const second = await (await handleUsage(usageReq({ cookie: session }), env, { op: "consume", sig: "0bb222", pages: 2 })).json();
  assert.equal(first.allowed, true);
  assert.equal(first.reason, "owner");
  assert.equal(second.allowed, true);
  assert.equal(second.reason, "owner");
  assert.equal(second.used, 0);
  assert.equal(second.credits, 0);
});

test("a code header alone, or a role in the body, grants nothing", async () => {
  const env = newEnv();
  const byHeader = await (await handleUsage(usageReq({ "x-owner-code": CODE }), env, { op: "consume", sig: "aaa111", pages: 1 })).json();
  const byBody = await (await handleUsage(usageReq(), env, { op: "consume", sig: "bbb222", pages: 1, role: "owner" })).json();
  assert.equal(byHeader.role, "customer");
  assert.equal(byBody.role, "customer");
});

test("status names the role", async () => {
  const env = newEnv();
  const session = await signedIn(env);
  assert.equal((await (await handleUsage(usageReq(), env, { op: "status", sig: "abc123" })).json()).role, "customer");
  const asOwner = await (await handleUsage(usageReq({ cookie: session }), env, { op: "status", sig: "abc123" })).json();
  assert.equal(asOwner.role, "owner");
  assert.equal(asOwner.allowed, true);
});

// ── the page's side ────────────────────────────────────────────────────────────

function stubFetch(status, body) {
  const seen = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    seen.push({ url, method: init.method, headers: init.headers, credentials: init.credentials });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return { seen, restore: () => (globalThis.fetch = real) };
}

test("the page shows the rate-limit wording, not 'invalid code'", async () => {
  const { restore } = stubFetch(429, { error: "too_many_attempts", message: "Too many attempts. Try again in a minute." });
  try {
    await assert.rejects(() => owner.signIn("anything"), {
      message: "Too many attempts. Try again in a minute.",
    });
  } finally {
    restore();
  }
});

test("the page shows the wrong-code wording for a 401", async () => {
  const { restore } = stubFetch(401, { error: "not_owner", message: "That code is not valid." });
  try {
    await assert.rejects(() => owner.signIn("anything"), { message: "That code is not valid." });
  } finally {
    restore();
  }
});

test("a rate limit with an unreadable body still reads as a rate limit", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("<html>429</html>", { status: 429, headers: { "content-type": "text/html" } });
  try {
    await assert.rejects(() => owner.signIn("anything"), /too many attempts/i);
  } finally {
    globalThis.fetch = real;
  }
});

test("a wrong code with no body is still a wrong code", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 401 });
  try {
    await assert.rejects(() => owner.signIn("anything"), { message: "That code is not valid." });
  } finally {
    globalThis.fetch = real;
  }
});

test("the code travels only in X-Owner-Code, on a same-origin POST, and is not stored", async () => {
  const { seen, restore } = stubFetch(200, { role: "owner" });
  const writes = [];
  const realStorage = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k) => writes.push(k), getItem: () => null, removeItem: () => {} };
  try {
    const out = await owner.signIn("THE-CODE");
    assert.equal(out.role, "owner");
    assert.equal(seen.length, 1);
    assert.equal(seen[0].method, "POST");
    assert.equal(seen[0].headers["X-Owner-Code"], "THE-CODE");
    assert.equal(seen[0].credentials, "same-origin");
    assert.deepEqual(writes, []);
  } finally {
    globalThis.localStorage = realStorage;
    restore();
  }
});

test("a dead network does not blame the code", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("network down");
  };
  try {
    await assert.rejects(() => owner.status(), /connection/i);
  } finally {
    globalThis.fetch = real;
  }
});
