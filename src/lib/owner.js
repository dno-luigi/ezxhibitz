// Signing in as the owner, from the page's side.
//
// The code is sent once, in a header, and never stored: the reply is a session
// cookie the browser keeps and the server verifies. Nothing here decides a role —
// it only carries the request and reports what the server answered.
const HEADER = "X-Owner-Code";

async function call(method, init = {}) {
  let res;
  try {
    res = await fetch("/api/owner/session", { method, credentials: "same-origin", ...init });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "That code is not valid.");
  return data;
}

export const owner = {
  /** { role: "owner" | "customer" } */
  status: () => call("GET"),
  /** Swap the code for a session. The code is not kept anywhere afterwards. */
  signIn: (code) => call("POST", { headers: { [HEADER]: String(code || "") } }),
  signOut: () => call("DELETE"),
};
