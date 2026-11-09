// Signing in as the owner, from the page's side.
//
// The code is sent once, in a header, and never stored: the reply is a session
// cookie the browser keeps and the server verifies. Nothing here decides a role —
// it only carries the request and reports what the server answered.
const HEADER = "X-Owner-Code";

// What to say when the reply carried no message of its own — an edge error or a
// rate limiter answering with HTML rather than JSON. A lockout must not be
// reported as a wrong code, or the owner keeps retyping a correct one.
const BY_STATUS = {
  401: "That code is not valid.",
  403: "Requests must come from this site.",
  405: "That request is not supported.",
  429: "Too many attempts. Wait a minute, then try again.",
};

async function call(method, init = {}) {
  let res;
  try {
    res = await fetch("/api/owner/session", { method, credentials: "same-origin", ...init });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback =
      BY_STATUS[res.status] ||
      (res.status >= 500 ? "The server had a problem. Try again in a moment." : "That code is not valid.");
    throw new Error(data.message || fallback);
  }
  return data;
}

export const owner = {
  /** { role: "owner" | "customer" } */
  status: () => call("GET"),
  /** Swap the code for a session. The code is not kept anywhere afterwards. */
  signIn: (code) => call("POST", { headers: { [HEADER]: String(code || "") } }),
  signOut: () => call("DELETE"),
};
