import { useRef } from "react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "@wron/kit";
import IdentifierSettings from "./IdentifierSettings";
import PreviewStrip from "./PreviewStrip";
import ItemOptions from "./ItemOptions";
import { FileIcon } from "./ui";
import { identifierFor, exhibitMap } from "../../lib/packet";
import { COPY } from "../../data/business";

function OutlineCard({ item, index, count, info, prev, b, startRef }) {
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const label = info.n == null ? COPY.mainDoc : identifierFor(info.n, b.settings.style, b.settings.prefix);
  const range = b.plan.ranges[item.id];
  const flashing = b.flash === item.id;
  const iconBtn = "press inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink disabled:opacity-30";

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => (startRef.current = b.items)}
      onDragEnd={() => startRef.current && b.commitReorder(startRef.current, item.id)}
      transition={{ duration: reduce ? 0 : 0.16 }}
      whileDrag={reduce ? undefined : { y: -4, boxShadow: "0 20px 40px -20px rgba(15,32,25,0.4)", zIndex: 10 }}
      className={cn(
        "relative overflow-hidden rounded-[16px] border border-line transition-colors duration-500",
        flashing ? "bg-[#E3F2EA]" : "bg-bg",
        index > 0 && !info.first && "ml-5"
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1.5", index === 0 ? "bg-primary" : "bg-primary/60")} />
      <div className="flex items-stretch gap-2 py-2 pl-4 pr-2">
        <button
          type="button"
          onClick={() => b.move(item.id, index > 0 ? -1 : 1)}
          aria-label={`Drag to reorder ${item.title}, or press to move it up`}
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: "none" }}
          className="group inline-flex w-12 shrink-0 cursor-grab items-center justify-center rounded-[12px] text-muted hover:bg-surface active:cursor-grabbing"
        >
          <GripVertical className="h-6 w-6 group-active:text-accent" />
        </button>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-x-2">
            {index > 0 && info.first ? <span aria-hidden="true" className="h-3 w-1.5 rounded-sm bg-accent" /> : null}
            <span className="t-label text-primary">{label}</span>
            {index > 0 && !info.first ? <span className="t-meta text-muted">continued</span> : null}
            {range ? <span className="t-meta tabular-nums text-muted">· pp. {range}</span> : null}
          </div>
          <label className="sr-only" htmlFor={`title-${item.id}`}>Title for {label}</label>
          <input
            id={`title-${item.id}`}
            value={item.title}
            onChange={(e) => b.rename(item.id, e.target.value)}
            className="-ml-2 mt-1 h-10 w-full rounded-[10px] border border-transparent bg-transparent px-2 text-[16px] font-medium text-ink hover:border-line focus:border-primary focus:outline-none"
          />
          <p className="flex items-center gap-1.5 t-meta text-muted">
            <FileIcon kind={item.kind} className="h-3.5 w-3.5" /> {item.kind} · {item.pageCount} {item.pageCount === 1 ? "page" : "pages"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center sm:flex-row">
          <button type="button" className={iconBtn} disabled={index === 0} onClick={() => b.move(item.id, -1)} aria-label={`Move up ${item.title}`}>
            <ArrowUp className="h-5 w-5" />
          </button>
          <button type="button" className={iconBtn} disabled={index === count - 1} onClick={() => b.move(item.id, 1)} aria-label={`Move down ${item.title}`}>
            <ArrowDown className="h-5 w-5" />
          </button>
        </div>
        <button type="button" className={cn(iconBtn, "self-center hover:text-accent")} onClick={() => b.remove(item.id)} aria-label={`Remove ${item.title}`}>
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <ItemOptions item={item} index={index} info={info} prev={b.ready[index - 1]} b={b} />
    </Reorder.Item>
  );
}

export default function ArrangeStage({ b, onPick }) {
  const startRef = useRef(null);
  const ex = exhibitMap(b.ready);
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-0">
      <div className="lg:col-span-5 lg:pr-6">
        <h2 className="t-card text-ink">{COPY.outline}</h2>
        <p className="mt-1 t-label font-normal text-muted">
          Drag the handles, or use the arrows. The top card is the main document. Under a photo, choose “Same page as photo above” to put several photos on one page, and set the page to portrait or landscape.
        </p>
        <Reorder.Group axis="y" values={b.ready} onReorder={b.setReadyOrder} className="mt-4 flex flex-col gap-3">
          {b.ready.map((it, i) => (
            <OutlineCard key={it.id} item={it} index={i} count={b.ready.length} info={ex[i]} prev={b.ready[i - 1]} b={b} startRef={startRef} />
          ))}
        </Reorder.Group>
        {b.ready.length === 1 ? <p className="mt-3 text-[15px] text-ink">{COPY.mainOnly}</p> : null}
        <button
          type="button"
          onClick={onPick}
          className="press mt-3 flex min-h-16 w-full items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-line text-[16px] text-muted hover:border-primary hover:text-primary"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
          Add another file
        </button>
      </div>
      <div className="border-line lg:col-span-3 lg:border-l lg:px-6">
        <IdentifierSettings settings={b.settings} setSettings={b.setSettings} />
      </div>
      <div className="border-line lg:col-span-4 lg:border-l lg:pl-6">
        <PreviewStrip b={b} />
      </div>
    </div>
  );
}
