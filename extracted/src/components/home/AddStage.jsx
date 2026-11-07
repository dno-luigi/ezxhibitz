import { motion, useReducedMotion } from "motion/react";
import { Img } from "@wron/kit";
import { AlertCircle, RotateCcw, Trash2, Info } from "lucide-react";
import DropZone from "./DropZone";
import { FileIcon } from "./ui";
import { formatBytes } from "../../lib/packet";
import { COPY } from "../../data/business";

const ERRORS = {
  unsupported: COPY.errUnsupported,
  password: COPY.errPassword,
  unreadable: COPY.errUnreadable,
  missing: "This file is no longer saved on this device. Remove it and add it again.",
};

function FileRow({ item, isMain, onRetry, onRemove }) {
  const reduce = useReducedMotion();
  const pct = Math.round((item.progress || 0) * 100);
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`flex items-start gap-3 rounded-[16px] border bg-bg p-3 ${item.status === "error" ? "border-accent/50" : "border-line"}`}
    >
      <span className="relative inline-flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-line bg-surface text-ink">
        {item.thumb ? <Img src={item.thumb} alt="" ratio="4/5" className="h-full w-full" imgClassName="object-cover" /> : <FileIcon kind={item.kind} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          {isMain ? <span className="rounded-full bg-surface px-2 py-0.5 t-meta font-semibold text-primary">{COPY.mainDoc}</span> : null}
          <p className="min-w-0 truncate text-[16px] font-medium text-ink">{item.name}</p>
        </div>
        {item.status === "reading" ? (
          <div className="mt-2">
            <div
              role="progressbar"
              aria-label={`Adding ${item.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2 overflow-hidden rounded-full bg-surface"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 t-meta tabular-nums text-muted">
              {pct < 100 ? `Reading ${pct}%` : "Counting pages"} · {formatBytes(item.size)}
            </p>
          </div>
        ) : item.status === "error" ? (
          <div className="mt-1">
            <p className="flex items-start gap-1.5 text-[14px] text-ink">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {ERRORS[item.error] || COPY.errUnreadable}
            </p>
            {item.hint ? <p className="mt-0.5 t-meta text-muted">{item.hint}</p> : null}
          </div>
        ) : (
          <p className="mt-0.5 t-meta tabular-nums text-muted">
            {item.kind} · {item.pageCount} {item.pageCount === 1 ? "page" : "pages"} · {formatBytes(item.size)}
            {item.note ? ` · ${item.note}` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {item.status === "error" && item.error === "unreadable" ? (
          <button type="button" onClick={onRetry} aria-label={`Retry ${item.name}`} className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink">
            <RotateCcw className="h-5 w-5" />
          </button>
        ) : null}
        <button type="button" onClick={onRemove} aria-label={`Remove ${item.name}`} className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-accent">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </motion.li>
  );
}

export default function AddStage({ b, onPick, onFiles }) {
  const firstReadyId = b.ready[0]?.id;
  const onlyMain = b.ready.length === 1 && !b.items.some((i) => i.status === "reading");
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <h2 className="t-card text-ink">{COPY.addTitle}</h2>
        <p className="mt-1 t-label font-normal text-muted">The first file is your main document. Exhibits follow in the order you add them.</p>
        <DropZone compact id="start" title={COPY.addExhibits} onPick={onPick} onFiles={onFiles} className="mt-4" />
        <p className="mt-3 flex items-start gap-1.5 t-meta text-muted">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Files are read in this browser and kept on this device for up to 30 days.
        </p>
      </div>
      <div className="lg:col-span-7">
        {onlyMain ? (
          <p role="status" className="mb-3 rounded-[14px] bg-surface p-3 text-[15px] font-medium text-ink">{COPY.mainOnly}</p>
        ) : null}
        <ul className="flex flex-col gap-3" aria-label="Your files">
          {b.items.map((it) => (
            <FileRow
              key={it.id}
              item={it}
              isMain={it.id === firstReadyId}
              onRetry={() => b.retry(it.id)}
              onRemove={() => b.remove(it.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
