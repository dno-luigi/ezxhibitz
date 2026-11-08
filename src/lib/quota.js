// The free-packet allowance, from the page's side.
//
// Building a packet never calls this. Only a finished export does: one call says
// whether a packet is available, and the same call is what the server counts.
import { cloudCall } from "@wron/kit";

/**
 * What makes this packet "this packet": the labeling settings and the files in
 * the order they will print. Sent with every allowance call so the server can
 * tell a re-export (free for seven days) from a new packet, and so a person
 * reusing the same template is recognised as themselves.
 */
export function packetSignature(b) {
  const s = b.settings || {};
  const parts = [
    s.style,
    s.prefix,
    s.slip ? 1 : 0,
    s.pageNumbers ? 1 : 0,
    s.position,
    ...(b.ready || []).map((it) =>
      [it.title, it.pageCount, it.joinPrev ? 1 : 0, it.samePage ? 1 : 0, it.orientation, it.scale].join("~"),
    ),
  ];
  const text = parts.join("|");
  // djb2: only has to be stable across reloads, not secret.
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return `${hash.toString(16)}${text.length.toString(16)}`;
}

const ask = (b, op, extra) =>
  cloudCall("usage", { op, sig: packetSignature(b), pages: b.plan?.total || 0, ...extra });

export const quota = {
  /** Read-only: { allowed, free, used, credits, remaining }. */
  status: (b) => ask(b, "status"),
  /** Count this export. A refusal comes back as { allowed: false }. */
  consume: (b) => ask(b, "consume"),
  /** A code from the owner after a payment, in packets. */
  redeem: (code) => cloudCall("usage", { op: "redeem", code }),
};
