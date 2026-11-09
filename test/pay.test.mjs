// A payment alert becomes a packet code, once per payment.
//
//   node --test test/pay.test.mjs
//
// Cash App has no webhook for a personal account, so an automation posts the
// payment here. These tests hold the two things that must never slip: no key, no
// code, and one payment, one code.
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { handlePaid } from "../worker/pay.js";
import { handleUsage } from "../worker/usage.js";

const PAY_KEY = "test-pay-key-0000000000000000000000";

function memKV() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
    keys: () => [...m.keys()],
    raw: (k) => m.get(k),
  };
}

function memR2() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? { json: async () => JSON.parse(m.get(k)) } : null),
    put: async (k, v) => void m.set(k, String(v)),
  };
}

const newEnv = () => ({ PAY_NOTIFY_KEY: PAY_KEY, KV: memKV(), FILES: memR2() });

const payReq = (body, headers = {}) =>
  new Request("https://ezxhibitz.test/api/pay/received", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const usageReq = () =>
  new Request("https://ezxhibitz.test/api/site/ezxhibitz/usage", { method: "POST", headers: {} });

const codes = (env) => env.KV.keys().filter((k) => k.startsWith("code:"));

test("a payment with the right key is answered with a packet code", async () => {
  const env = newEnv();
  const res = await handlePaid(payReq({ amount: "7.99", email: "buyer@example.com", id: "txn-1" }, { "x-pay-key": PAY_KEY }), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.code, /^PACKET-[A-Z0-9]{12}$/);
  assert.equal(body.packets, 1);
  assert.equal(body.email, "buyer@example.com");
  assert.equal(body.needs_email, false);
});

test("the minted code is a real code: it buys an export at the paywall", async () => {
  const env = newEnv();
  const body = await (
    await handlePaid(payReq({ amount: 7.99, email: "buyer@example.com", id: "txn-2" }, { "x-pay-key": PAY_KEY }), env)
  ).json();

  const redeemed = await (
    await handleUsage(usageReq(), env, { op: "redeem", code: body.code.toLowerCase() })
  ).json();
  assert.equal(redeemed.added, 1);
  assert.equal(redeemed.credits, 1);
  // Single use, like every other code.
  const again = await handleUsage(usageReq(), env, { op: "redeem", code: body.code });
  assert.equal(again.status, 404);
});

test("no key, a wrong key, or no key configured mints nothing", async () => {
  const env = newEnv();
  assert.equal((await handlePaid(payReq({ amount: 7.99, id: "t1" }), env)).status, 401);
  assert.equal((await handlePaid(payReq({ amount: 7.99, id: "t2" }, { "x-pay-key": "nope" }), env)).status, 401);

  const unset = { ...newEnv(), PAY_NOTIFY_KEY: "" };
  assert.equal((await handlePaid(payReq({ amount: 7.99, id: "t3" }, { "x-pay-key": "" }), unset)).status, 503);
  assert.equal(codes(env).length, 0);
});

test("the body is not read until the key is accepted", async () => {
  const env = newEnv();
  const res = await handlePaid(payReq("not even json"), env);
  assert.equal(res.status, 401);
});

test("a payment below the packet price is refused, and mints nothing", async () => {
  const env = newEnv();
  const res = await handlePaid(payReq({ amount: "$1.00", email: "buyer@example.com", id: "txn-3" }, { "x-pay-key": PAY_KEY }), env);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "amount_too_low");
  assert.equal(codes(env).length, 0);
});

test("the same payment sent twice returns the same code, not a second packet", async () => {
  const env = newEnv();
  const first = await (await handlePaid(payReq({ amount: 7.99, email: "buyer@example.com", id: "txn-4" }, { "x-pay-key": PAY_KEY }), env)).json();
  const second = await (await handlePaid(payReq({ amount: 7.99, email: "buyer@example.com", id: "txn-4" }, { "x-pay-key": PAY_KEY }), env)).json();
  assert.equal(second.duplicate, true);
  assert.equal(second.code, first.code);
  assert.equal(codes(env).length, 1);
});

test("the buyer's address is lifted out of the Cash App note", async () => {
  const env = newEnv();
  const body = await (
    await handlePaid(payReq({ amount: 7.99, note: "packet for buyer@example.com thanks", id: "txn-5" }, { "x-pay-key": PAY_KEY }), env)
  ).json();
  assert.equal(body.email, "buyer@example.com");
});

test("a payment with no address still mints a code and says it needs one", async () => {
  const env = newEnv();
  const body = await (await handlePaid(payReq({ amount: 7.99, note: "packet", id: "txn-6" }, { "x-pay-key": PAY_KEY }), env)).json();
  assert.equal(body.needs_email, true);
  assert.equal(body.email, "");
  assert.match(body.code, /^PACKET-/);
});

test("paying for three packets issues three", async () => {
  const env = newEnv();
  const body = await (await handlePaid(payReq({ amount: 23.97, email: "buyer@example.com", id: "txn-7" }, { "x-pay-key": PAY_KEY }), env)).json();
  assert.equal(body.packets, 3);
});

test("the price here is the price on the card", async () => {
  const plans = await readFile(new URL("../src/data/plans.js", import.meta.url), "utf8");
  assert.match(plans, /price: "\$7\.99"/);
});
