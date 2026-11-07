import { useLocation, useNavigate } from "react-router";
import Button from "./Button";
import { requestStartPacket } from "../lib/startPacket";
import { COPY } from "../data/business";

// The site-wide "Start a packet" action: opens the builder's file picker.
export default function StartPacketButton({ children = COPY.start, onDone, ...props }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <Button
      {...props}
      onClick={() => {
        onDone?.();
        requestStartPacket(navigate, pathname);
      }}
    >
      {children}
    </Button>
  );
}
