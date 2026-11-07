import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { scrollToSection } from "@wron/kit";
import Button from "../Button";
import { StepRail } from "./ui";
import AddStage from "./AddStage";
import ArrangeStage from "./ArrangeStage";
import ExportStage from "./ExportStage";
import { COPY } from "../../data/business";

const ORDER = ["add", "arrange", "export"];

function SaveStatus({ state }) {
  if (state === "idle") return null;
  return (
    <span role="status" className="inline-flex items-center gap-1.5 t-label text-muted">
      {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
      {state === "saving" ? "Saving" : COPY.saved}
    </span>
  );
}

function UndoBar({ undo, onUndo, onClose }) {
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [undo]);
  if (!undo) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8" role="status">
      <div className="flex items-center gap-4 rounded-full bg-ink py-2 pl-5 pr-2 text-[15px] text-bg shadow-lg">
        <span>{undo.label}</span>
        <button type="button" onClick={onUndo} className="press inline-flex h-11 items-center gap-1.5 rounded-full bg-bg/10 px-4 font-semibold hover:bg-bg/20">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> {COPY.undo}
        </button>
      </div>
    </div>
  );
}

export default function Builder({ b, onPick, onFiles }) {
  const [stage, setStage] = useState("add");
  const reduce = useReducedMotion();
  const idx = ORDER.indexOf(stage);
  const canNext = b.ready.length > 0;

  const go = (s) => {
    setStage(s);
    setTimeout(() => scrollToSection("builder"), 30);
  };

  const nextLabel = stage === "add" ? "Continue to arrange" : "Continue to export";

  return (
    <section id="builder" aria-label="Packet builder" className="mx-auto max-w-[1180px] px-3 pb-14 sm:px-6 md:pb-20">
      <div className="rounded-[24px] bg-surface p-3 sm:p-5 md:p-6">
        <div className="flex flex-col gap-2 px-1 pb-4 md:flex-row md:items-center md:gap-6">
          <div className="flex-1">
            <StepRail stage={stage} onChange={(s) => (s === "add" || canNext) && go(s)} done={ORDER.slice(0, idx)} />
          </div>
          <div className="flex items-center justify-between gap-4 md:justify-end">
            <SaveStatus state={b.saveState} />
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Start a new packet? This clears the current files from this device.")) {
                  b.reset();
                }
              }}
              className="press min-h-11 rounded-full px-3 t-label text-muted hover:bg-bg hover:text-ink"
            >
              Start over
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            initial={reduce ? { opacity: 1 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, x: -20 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[20px] bg-bg p-4 md:p-6"
          >
            {stage === "add" ? <AddStage b={b} onPick={onPick} onFiles={onFiles} /> : null}
            {stage === "arrange" ? <ArrangeStage b={b} onPick={onPick} /> : null}
            {stage === "export" ? <ExportStage b={b} /> : null}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-0 z-30 -mx-3 mt-3 flex items-center gap-3 border-t border-line bg-surface/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none">
          {idx > 0 ? (
            <Button variant="outline" size="lg" onClick={() => go(ORDER[idx - 1])} className="shrink-0 px-5" aria-label="Back">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          ) : null}
          {idx < 2 ? (
            <Button size="lg" disabled={!canNext} onClick={() => go(ORDER[idx + 1])} className="group flex-1 md:ml-auto md:flex-none">
              {nextLabel}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          ) : (
            <p className="flex-1 text-right t-label font-normal text-muted">{b.plan.total} pages in this packet</p>
          )}
        </div>
      </div>
      <UndoBar undo={b.undo} onUndo={b.applyUndo} onClose={() => b.setUndo(null)} />
    </section>
  );
}
