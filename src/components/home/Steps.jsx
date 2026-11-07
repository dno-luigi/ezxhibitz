import { motion, useReducedMotion } from "motion/react";
import { CloudUpload, GripVertical, Plus } from "lucide-react";
import { Reveal } from "@wron/kit";
import StartPacketButton from "../StartPacketButton";
import { FileIcon } from "./ui";
import { STEPS, SECTIONS, COPY } from "../../data/business";

const view = { once: true, amount: 0.5 };

function MiniAdd({ reduce }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[16px] border-2 border-dashed border-line bg-bg px-4 py-8">
      <CloudUpload className="h-10 w-10 text-primary" strokeWidth={1.6} aria-hidden="true" />
      <StartPacketButton size="sm">{COPY.choose}</StartPacketButton>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={view}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-1 flex w-full items-center gap-2 rounded-[10px] border border-line bg-bg p-2"
        aria-hidden="true"
      >
        <FileIcon kind="PDF" className="h-4 w-4 text-muted" />
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
          <motion.span
            className="block h-full rounded-full bg-primary"
            initial={reduce ? false : { width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={view}
            transition={{ duration: 0.9, delay: 0.5 }}
          />
        </span>
      </motion.div>
    </div>
  );
}

function MiniArrange({ reduce }) {
  const rows = [
    { kind: "PDF", bar: "bg-primary" },
    { kind: "Image", bar: "bg-accent" },
    { kind: "Other", bar: "bg-primary" },
  ];
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={reduce || i !== 1 ? false : { y: 46 }}
          whileInView={{ y: 0 }}
          viewport={view}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center gap-3 overflow-hidden rounded-[12px] border border-line bg-bg py-2.5 pl-4 pr-2"
        >
          <span className={`absolute inset-y-0 left-0 w-1 ${r.bar}`} />
          <FileIcon kind={r.kind} className="h-4 w-4 text-ink" />
          <span className="h-2 flex-1 rounded bg-surface" />
          <GripVertical className="h-4 w-4 text-muted" />
        </motion.div>
      ))}
      <div className="flex items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-line py-3 t-meta text-muted">
        <Plus className="h-3.5 w-3.5" /> Add another file
      </div>
    </div>
  );
}

function MiniExport({ reduce }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[16px] border border-line bg-bg p-4" aria-hidden="true">
      <div className="relative aspect-[8.5/11] w-24 rounded-[4px] border border-line bg-white p-2 shadow-sm">
        <motion.span
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={view}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="absolute right-1 top-1 rounded-[2px] bg-primary px-1 text-[7px] font-semibold text-primary-ink"
        >
          Exhibit A
        </motion.span>
        <div className="mt-4 flex flex-col gap-1.5">
          {[90, 80, 86, 60, 84, 70].map((w, k) => (
            <span key={k} className="h-[3px] rounded bg-[#E2E6E4]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <span className="flex h-10 w-full items-center justify-center rounded-full bg-primary t-label text-primary-ink">{COPY.download}</span>
      <span className="flex h-10 w-full items-center justify-center rounded-full border border-primary t-label text-primary">{COPY.share}</span>
    </div>
  );
}

const MINIS = [MiniAdd, MiniArrange, MiniExport];

export default function Steps() {
  const reduce = useReducedMotion();
  return (
    <section id={SECTIONS.how} className="scroll-mt-20 bg-surface py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-page px-5 md:px-6 lg:px-10">
        <Reveal y={10}>
          <h2 className="t-section text-ink max-md:text-[44px] max-md:leading-[1.02] md:text-center">
            Three steps.<br className="md:hidden" /> One packet.
          </h2>
        </Reveal>
        <div className="relative mt-10 md:mt-12">
          <span aria-hidden="true" className="absolute left-[6%] right-[6%] top-[46px] hidden h-px bg-line md:block" />
          <ol className="relative grid gap-5 md:grid-cols-[0.9fr_1.15fr_1fr] md:gap-5">
            {STEPS.map((s, i) => {
              const Mini = MINIS[i];
              return (
                <li key={s.n} className="relative overflow-hidden rounded-2xl bg-bg px-7 py-6 max-md:min-h-[140px] md:rounded-[20px] md:p-7">
                  <div className="flex items-start gap-4 md:block">
                    <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-ink tabular-nums md:h-10 md:w-10 md:bg-primary/15 md:text-[16px] md:font-semibold md:text-primary">
                      {s.n}
                    </span>
                    <div className="md:mt-5">
                      <h3 className="t-card text-2xl text-ink md:text-[22px]">{s.title}</h3>
                      <p className="mt-1 text-lg leading-6 text-muted md:text-[17px]">{s.body}</p>
                    </div>
                  </div>
                  <div className="mt-6 hidden md:block">
                    <Mini reduce={reduce} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
