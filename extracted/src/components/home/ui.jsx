import { useId } from "react";
import { FileText, Image as ImageIcon, FileType, Paperclip, Check } from "lucide-react";
import { cn, Img } from "@wron/kit";
import { layoutImages } from "../../lib/packet";

export function FileIcon({ kind, className }) {
  const Icon = kind === "Image" ? ImageIcon : kind === "Word" ? FileType : kind === "PDF" ? FileText : Paperclip;
  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}

export function Segmented({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-full border border-line bg-bg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "press h-12 rounded-full t-label lg:h-10",
            value === o.value ? "bg-primary text-primary-ink" : "text-muted hover:bg-surface hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <label htmlFor={id} className="t-label text-ink">{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-7" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

export const POSITIONS = [
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-left", label: "Bottom left" },
];

export function StepRail({ stage, onChange, done = [] }) {
  const steps = [
    { id: "add", n: 1, label: "Add" },
    { id: "arrange", n: 2, label: "Arrange" },
    { id: "export", n: 3, label: "Export" },
  ];
  return (
    <ol className="flex w-full items-center gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const active = stage === s.id;
        const inner = (
          <>
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums",
                active ? "bg-primary text-primary-ink" : "border border-line bg-bg text-ink"
              )}
            >
              {done.includes(s.id) && !active ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : s.n}
            </span>
            <span className={cn("text-[16px] sm:text-[17px]", active ? "font-semibold text-ink" : "text-ink/80")}>{s.label}</span>
          </>
        );
        return (
          <li key={s.id} className={cn("flex items-center gap-2 sm:gap-4", i < 2 && "flex-1")}>
            {onChange ? (
              <button
                type="button"
                onClick={() => onChange(s.id)}
                aria-current={active ? "step" : undefined}
                className="press flex min-h-12 items-center gap-2 rounded-full pr-2 sm:gap-3"
              >
                {inner}
              </button>
            ) : (
              <span aria-current={active ? "step" : undefined} className="flex min-h-12 items-center gap-2 sm:gap-3">{inner}</span>
            )}
            {i < 2 ? <span aria-hidden="true" className="hidden h-px flex-1 bg-line sm:block" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

// The photos of one page, placed exactly as the exported PDF places them.
function PageImages({ images, orientation }) {
  const lay = layoutImages(images, orientation);
  return (
    <div className="absolute inset-0">
      {lay.rects.map((r, k) => (
        <div
          key={k}
          className="absolute overflow-hidden bg-surface"
          style={{
            left: `${(r.x / lay.pw) * 100}%`,
            top: `${(r.y / lay.ph) * 100}%`,
            width: `${(r.w / lay.pw) * 100}%`,
            height: `${(r.h / lay.ph) * 100}%`,
          }}
        >
          {images[k].thumb ? (
            <Img src={images[k].thumb} alt="" ratio="1/1" className="absolute inset-0 h-full w-full" imgClassName="object-contain" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// One miniature page of the packet, with its identifier and page number as they will print.
export function PageTile({ page, number, total, settings, className }) {
  const pos = settings.position;
  const tagLeft = settings.pageNumbers && pos === "top-right";
  const numCls = {
    "top-right": "top-[4%] right-[6%]",
    "top-left": "top-[4%] left-[6%]",
    "bottom-right": "bottom-[4%] right-[6%]",
    "bottom-center": "bottom-[4%] left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-[4%] left-[6%]",
  }[pos];
  return (
    <div
      style={{ aspectRatio: page.landscape ? "11 / 8.5" : "8.5 / 11" }}
      className={cn("relative w-full overflow-hidden rounded-[6px] border border-line bg-white shadow-[0_8px_24px_-14px_rgba(15,32,25,0.3)]", className)}
    >
      {page.type === "slip" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
          <span className="text-[15px] font-semibold text-ink">{page.tag}</span>
          <span className="line-clamp-2 t-meta text-muted">{page.title}</span>
        </div>
      ) : page.images ? (
        <PageImages images={page.images} orientation={page.orientation} />
      ) : (
        <div className="absolute inset-[16%_12%] flex flex-col gap-[7%]" aria-hidden="true">
          <span className="h-[3%] w-[45%] rounded bg-[#D9DEDB]" />
          {[92, 86, 90, 70, 88, 80, 60, 84, 66].map((w, k) => (
            <span key={k} className="h-[2.4%] rounded bg-[#E4E8E6]" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {page.tag && page.type !== "slip" ? (
        <span className={cn("absolute top-[4%] rounded-[3px] bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-ink", tagLeft ? "left-[6%]" : "right-[6%]")}>
          {page.tag}
        </span>
      ) : null}
      {settings.pageNumbers && number ? (
        <span className={cn("absolute text-[9px] tabular-nums text-muted", numCls)}>
          {number}/{total}
        </span>
      ) : null}
    </div>
  );
}
