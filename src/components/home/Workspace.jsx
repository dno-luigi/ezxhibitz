import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { scrollToSection } from "@wron/kit";
import { useBuilder } from "./useBuilder";
import Hero from "./Hero";
import CompactBand from "./CompactBand";
import ExampleArrangement from "./ExampleArrangement";
import { START_PACKET_EVENT } from "../../lib/startPacket";
import { ACCEPT } from "../../data/business";

// The builder (stages, PDF export code) downloads only once a file is added.
const Builder = lazy(() => import("./Builder"));

// The hero and the builder share one state: before any file it is the landing
// hero plus an example board; after the first file the builder takes over.
export default function Workspace() {
  const b = useBuilder();
  const inputRef = useRef(null);
  const [settled, setSettled] = useState(false);
  const [params, setParams] = useSearchParams();
  const has = b.items.length > 0;

  const focusEntry = () => {
    const el = document.getElementById("start");
    if (el) {
      scrollToSection("start");
      el.focus({ preventScroll: true });
    }
  };

  const pick = () => {
    setSettled(true);
    inputRef.current?.click();
  };

  useEffect(() => {
    const onStart = () => {
      pick();
      focusEntry();
    };
    window.addEventListener(START_PACKET_EVENT, onStart);
    return () => window.removeEventListener(START_PACKET_EVENT, onStart);
  }, []);

  useEffect(() => {
    if (params.get("start") === "1") {
      setTimeout(focusEntry, 150);
      const next = new URLSearchParams(params);
      next.delete("start");
      setParams(next, { replace: true });
    }
  }, []);

  const onFiles = (list) => {
    setSettled(true);
    b.addFiles(list);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {has ? (
        <>
          <CompactBand />
          <Suspense fallback={<div className="mx-auto h-[420px] max-w-[1180px] px-3 pb-14 sm:px-6" aria-busy="true" />}>
            <Builder b={b} onPick={pick} onFiles={onFiles} />
          </Suspense>
        </>
      ) : (
        <>
          <Hero onPick={pick} onFiles={onFiles} settled={settled} onSettle={() => setSettled(true)} deletedNote={b.deletedNote} />
          <ExampleArrangement b={b} onPick={pick} />
        </>
      )}
    </>
  );
}
