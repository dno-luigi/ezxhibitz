// Cash App gives a personal account no webhook for money arriving, so the alert
// itself has to become the trigger. An email receipt (forwarded or parsed) or the
// phone's own notification is handed to an automation — Zapier, n8n, an Apps
// Script, emailreceipts.io — and that automation POSTs the payment here:
//
//   POST /api/pay/received
//   x-pay-key: <PAY_NOTIFY_KEY>
//   {"amount":"7.99","email":"buyer@example.com","id":"cash-app-reference","from":"$buyer"}
//
// The reply carries a real packet code, the same kind the owner mints by hand, so
// the automation can email it to the buyer and the existing "already paid?" box
// redeems it. The endpoint is idempotent per payment reference: a retried
// notification returns the same code rather than selling a second packet.
//
// Nothing here is reachable without the key, and the key never leaves the Worker.
import { fail, json, nowIso, sha256Hex } from "./util.js";

const PACKET_CENTS = 799; // keep in step with src/data/plans.js
const PACKET_PRICE = PACKET_CENTS / 100;
const MAX_PACKETS = 20;
const CODE_TTL = 60 * 60 * 24 * 90; // a paid code keeps for three months
const CODE = (code) => `code:${code}`;
const PAID = (id) => `paid:${id}`;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alikes
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/** Same reasoning as the owner code: trim both sides, then compare digests. */
async function keyMatches(env, provided) {
  const expected = String(env?.PAY_NOTIFY_KEY || "").trim();
  provided = String(provided || "").trim().replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  if (provided.length > 512) return false;
  const a = await sha256Hex(`pay-notify:${expected}`);
  const b = await sha256Hex(`pay-notify:${provided}`);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** "$7.99" and 7.99 both mean seven dollars and ninety-nine cents. */
function dollars(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
  const text = String(raw == null ? "" : raw).replace(/[^0-9.]/g, "");
  if (!text) return NaN;
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
}

function packetCount(amount) {
  // A rounding fudge so 799 coins is not read as one packet short.
  return Math.min(MAX_PACKETS, Math.max(0, Math.floor((amount + 0.005) / PACKET_PRICE)));
}

function code() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `PACKET-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

/** The buyer's address, from the note they typed or from the automation. */
function buyerEmail(body) {
  const candidates = [body.email, body.buyer_email, body.note];
  for (const raw of candidates) {
    const found = String(raw == null ? "" : raw).match(/[^\s@,;<>]+@[^\s@,;<>]+\.[A-Za-z]{2,24}/);
    if (found && EMAIL.test(found[0])) return found[0].toLowerCase().slice(0, 200);
  }
  return "";
}

export async function handlePaid(request, env) {
  if (request.method !== "POST") return fail(405, "method_not_allowed", "Use POST.");
  if (!env?.KV) return fail(503, "not_connected", "Packet codes are not connected on this site yet.");
  if (!String(env.PAY_NOTIFY_KEY || "").trim()) {
    return fail(503, "not_connected", "Payment notifications are not connected yet: set PAY_NOTIFY_KEY.");
  }
  // Checked before the body is read, so an unauthenticated caller learns nothing.
  const key = request.headers.get("x-pay-key") || request.headers.get("authorization") || "";
  if (!(await keyMatches(env, key))) return fail(401, "not_allowed", "That payment key is not valid.");

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Send the payment as JSON.");
  }
  if (!body || typeof body !== "object") return fail(400, "invalid_body", "Send the payment as JSON.");

  const amount = dollars(body.amount);
  if (!Number.isFinite(amount)) return fail(400, "missing_amount", "A payment needs an amount.");
  const packets = packetCount(amount);
  if (packets < 1) {
    return fail(400, "amount_too_low", `A packet costs $${PACKET_PRICE.toFixed(2)}; that payment is short.`);
  }

  const email = buyerEmail(body);
  // The automation's own reference is the best dedupe key; without one, the same
  // payer paying the same amount twice in a day is deliberately treated as one.
  const reference = String(body.id || body.txn || body.payment_id || "").trim().slice(0, 200);
  const stamp = nowIso().slice(0, 10);
  const id = reference
    ? reference
    : `auto-${(await sha256Hex(`pay:${body.from || ""}:${amount.toFixed(2)}:${email}:${stamp}`)).slice(0, 32)}`;

  const seen = await env.KV.get(PAID(id));
  if (seen) {
    // The same payment arriving twice is not a second sale.
    try {
      const held = JSON.parse(seen);
      return json({ ok: true, duplicate: true, code: held.code, packets: held.packets, email: held.email || "" });
    } catch {
      return json({ ok: true, duplicate: true });
    }
  }

  const minted = code();
  const record = { packets, email, at: nowIso(), source: "cashapp", reference: reference || id };
  try {
    await env.KV.put(CODE(minted), JSON.stringify({ packets, at: record.at, email }), { expirationTtl: CODE_TTL });
    // Written after the code exists, so a retry can never hand out a code that was
    // never stored.
    await env.KV.put(PAID(id), JSON.stringify({ code: minted, packets, email, at: record.at }), {
      expirationTtl: CODE_TTL,
    });
  } catch (err) {
    console.error("could not store a paid code:", err && err.message ? err.message : err);
    return fail(500, "server_error", "The code could not be stored. Try the notification again.");
  }

  // needs_email is the automation's prompt to fetch the address itself; the code
  // is still real, and the owner can read it out if the note carried nothing.
  return json({ ok: true, code: minted, packets, email, needs_email: !email });
}
