import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@wron/kit";
import Button from "../Button";
import { PageTile } from "./ui";
import { COPY } from "../../data/business";

// The final packet page by page, plus a full preview of the real PDF.
export default function PreviewStrip({ b, className, maxHeight = "max-h-[560px]" }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const { pages, total } = b.plan;

  const openPreview = async () => {
    setFailed(false);
    setBusy(true);
    const win = window.open("", "_blank");
    try {
      const blob = await b.build();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch {
      if (win) win.close();
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="t-label text-[16px] text-ink">{COPY.preview}</h3>
        <span className="t-meta tabular-nums text-muted">
          {total} {total === 1 ? "page" : "pages"}
        </span>
      </div>
      {total ? (
        <ol
          aria-label="Packet pages"
          className={cn("mt-4 grid grid-cols-2 gap-3 overflow-y-auto rounded-[14px] bg-surface p-3 sm:grid-cols-3 lg:grid-cols-2", maxHeight)}
        >
          {pages.slice(0, 200).map((p, i) => (
            <li key={`${p.itemId}-${p.type}-${p.k ?? "s"}`}>
              <PageTile page={p} number={i + 1} total={total} settings={b.settings} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-[14px] bg-surface p-4 text-[15px] text-muted">Add a file to see the pages here.</p>
      )}
      {pages.length > 200 ? <p className="mt-2 t-meta text-muted">Showing the first 200 pages.</p> : null}
      <Button variant="outline" size="md" onClick={openPreview} disabled={busy || !total} className="mt-4 w-full">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-5 w-5" aria-hidden="true" />}
        {busy ? "Building preview" : "Open full preview"}
      </Button>
      {failed ? (
        <p role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink">
          {COPY.errPreview.replace(" Retry.", "")}
          <button type="button" onClick={openPreview} className="min-h-11 font-semibold text-primary underline underline-offset-2">
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
