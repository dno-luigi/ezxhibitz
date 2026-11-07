import { useId } from "react";
import { cn } from "@wron/kit";
import { Toggle } from "./ui";

function Choice({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <span className="t-label text-ink" id={`${label}-lbl`}>{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1 rounded-[14px] border border-line bg-bg p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "press min-h-11 rounded-[10px] px-2 t-label leading-tight",
              value === o.value ? "bg-primary text-primary-ink" : "text-muted hover:bg-surface hover:text-ink"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Extra controls under a card in the outline:
// where a file sits (own exhibit, same exhibit, same page) and, for photos, size and page orientation.
export default function ItemOptions({ item, index, info, prev, b }) {
  const sliderId = useId();
  const canJoin = index >= 2;
  const isImage = item.kind === "Image";
  if (!canJoin && !isImage) return null;

  const prevIsImage = prev?.kind === "Image";
  const canShare = isImage && canJoin && prevIsImage;
  const joined = canJoin && !!item.joinPrev;
  const sharing = canShare && joined && !!item.samePage;
  const placement = sharing ? "page" : joined ? "exhibit" : "own";
  const pct = Math.round((item.scale || 1) * 100);

  const setPlacement = (v) => {
    if (v === "own") b.update(item.id, { joinPrev: false, samePage: false });
    else if (v === "exhibit") b.update(item.id, { joinPrev: true, samePage: false });
    else {
      // Same page: shrink both photos so they sit side by side, unless already smaller.
      b.update(item.id, { joinPrev: true, samePage: true, scale: Math.min(item.scale || 1, 0.45) });
      if (prev && (prev.scale || 1) > 0.5) b.update(prev.id, { scale: 0.45 });
    }
  };

  return (
    <div className="flex flex-col gap-1 border-t border-line bg-surface/60 px-4 py-2">
      {canJoin && isImage && canShare ? (
        <Choice
          label="Where this photo goes"
          value={placement}
          onChange={setPlacement}
          options={[
            { value: "own", label: "Own exhibit" },
            { value: "exhibit", label: "Same exhibit, new page" },
            { value: "page", label: "Same page as photo above" },
          ]}
        />
      ) : canJoin ? (
        <Toggle
          label="Same exhibit as the file above"
          checked={joined}
          onChange={(v) => b.update(item.id, { joinPrev: v, samePage: false })}
        />
      ) : null}

      {isImage && !sharing ? (
        <Choice
          label="Page orientation"
          value={item.orientation || "auto"}
          onChange={(orientation) => b.update(item.id, { orientation })}
          options={[
            { value: "auto", label: "Auto" },
            { value: "portrait", label: "Portrait" },
            { value: "landscape", label: "Landscape" },
          ]}
        />
      ) : null}
      {isImage && sharing ? (
        <p className="t-meta text-muted">This photo shares a page. Orientation follows the first photo on that page.</p>
      ) : null}

      {isImage ? (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center justify-between">
            <label htmlFor={sliderId} className="t-label text-ink">Photo size</label>
            <span className="t-label tabular-nums text-muted">{pct}%</span>
          </div>
          <input
            id={sliderId}
            type="range"
            min={20}
            max={100}
            step={5}
            value={pct}
            onChange={(e) => b.update(item.id, { scale: Number(e.target.value) / 100 })}
            style={{ accentColor: "#0E7A54" }}
            className="h-11 w-full cursor-pointer"
          />
        </div>
      ) : null}
    </div>
  );
}
