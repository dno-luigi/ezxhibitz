// "Start a packet" from anywhere: the header, menu, footer and pricing call
// requestStartPacket(navigate, pathname). On the home page it fires the
// START_PACKET_EVENT on window; the builder listens for it, opens its
// multi-file picker and focuses the upload card. From another page it goes
// to "/?start=1"; the home page reads that param on mount and does the same.
export const START_PACKET_EVENT = "epb:start-packet";

export function requestStartPacket(navigate, pathname) {
  if (typeof window === "undefined") return;
  if (pathname === "/") {
    window.dispatchEvent(new CustomEvent(START_PACKET_EVENT));
  } else {
    navigate("/?start=1");
  }
}
