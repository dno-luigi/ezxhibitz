import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Plus } from "lucide-react";
import Button from "../Button";
import IdentifierSettings from "./IdentifierSettings";
import { FileIcon, PageTile, StepRail } from "./ui";
import { identifierFor } from "../../lib/packet";
import { COPY } from "../../data/business";

const EXAMPLE = [
  { id: "main", kind: "PDF", label: "Main document" },
  { id: "ex", kind: "Image", label: "Exhibit A" },
  { id: "att", kind: "Other", label: "Attachment" },
];

function ExampleCard({ item, first, onMoveUp }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      transition={{ duration: 0.16 }}
      whileDrag={{ y: -4, boxShadow: "0 18px 36px -18px rgba(15,32,25,0.35)" }}
      className="relative flex items-center gap-3 overflow-hidden rounded-[14px] border border-line bg-bg py-3 pl-5 pr-2"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${first ? "bg-primary" : "bg-accent"}`} />
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-surface text-ink">
        <FileIcon kind={item.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium text-ink">{item.label}</span>
        <span className="block t-meta text-muted">Pages calculate after upload</span>
      </span>
      <button
        type="button"
        onClick={onMoveUp}
        aria-label={`Drag ${item.label}, or press to move it up`}
        onPointerDown={(e) => controls.start(e)}
        style={{ touchAction: "none" }}
        className="inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-[10px] text-muted hover:bg-surface active:cursor-grabbing active:text-accent"
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </Reorder.Item>
  );
}

// Before any upload: what the builder looks like, with live identifier settings.
export default function ExampleArrangement({ b, onPick }) {
  const [list, setList] = useState(EXAMPLE);
  const tag = identifierFor(0, b.settings.style, b.settings.prefix);

  return (
    <section id="builder" className="mx-auto hidden max-w-page px-4 pb-20 sm:px-6 md:block lg:px-10 lg:pb-24">
      <div className="min-h-[620px] rounded-[24px] bg-surface p-3 sm:p-5 md:p-6">
        <div className="flex h-24 items-center px-8">
          <StepRail stage="add" />
        </div>
        <div className="grid gap-6 rounded-[20px] border border-line bg-bg/70 p-4 md:p-8 lg:grid-cols-12 lg:gap-0">
          <div className="lg:col-span-5 lg:pr-6">
            <h2 className="t-card text-ink">Example arrangement</h2>
            <Reorder.Group axis="y" values={list} onReorder={setList} className="mt-4 flex flex-col gap-3">
              {list.map((it, i) => (
                <ExampleCard
                  key={it.id}
                  item={it}
                  first={i === 0}
                  onMoveUp={() =>
                    setList((l) => {
                      const next = [...l];
                      const j = i === 0 ? 1 : i - 1;
                      if (j >= next.length) return l;
                      [next[j], next[i]] = [next[i], next[j]];
                      return next;
                    })
                  }
                />
              ))}
            </Reorder.Group>
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
            <h3 className="t-label text-[16px] text-ink">{COPY.preview}</h3>
            <div className="mx-auto mt-4 max-w-[220px]">
              <PageTile page={{ type: "page", tag: b.settings.slip ? null : tag }} number={1} total={1} settings={b.settings} />
            </div>
            {b.settings.slip ? (
              <p className="mt-3 text-center t-meta text-muted">
                Slip sheets on: each exhibit starts with a page reading “{tag}”.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-3">
              <Button size="lg" onClick={onPick} aria-describedby="example-note">{COPY.download}</Button>
              <Button size="lg" variant="outline" onClick={onPick} aria-describedby="example-note" className="border-primary text-primary">
                {COPY.share}
              </Button>
              <p id="example-note" className="text-center t-meta text-muted">Add your files first. Then export.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
