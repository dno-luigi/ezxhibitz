import { useState } from "react";
import { Check, Copy, Download, Link2, Loader2 } from "lucide-react";
import { upload, table, toast } from "@wron/kit";
import Button from "../Button";
import PreviewStrip from "./PreviewStrip";
import { formatDate, removalDate } from "../../lib/packet";
import { COPY } from "../../data/business";

const fileNameFor = (b) => {
  const base = (b.ready[0]?.title || "packet").replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "packet";
  return `${base} packet.pdf`;
};

export default function ExportStage({ b }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const share = b.share;
  const expires = share ? removalDate(share.createdAt, 30) : null;

  const download = async () => {
    setError(null);
    setBusy("download");
    try {
      const blob = await b.build();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(b);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError("download");
    } finally {
      setBusy(null);
    }
  };

  const createLink = async () => {
    setError(null);
    setBusy("share");
    try {
      const blob = await b.build();
      const file = new File([blob], fileNameFor(b), { type: "application/pdf" });
      const { url } = await upload(file);
      const createdAt = Date.now();
      await table("share_links")
        .add({ url, file_name: file.name, page_count: b.plan.total, action: "created", remove_by: removalDate(createdAt, 30).toISOString().slice(0, 10) })
        .catch(() => {});
      b.setShare({ url, createdAt, removed: false });
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied");
      } catch {
        /* the link is shown below to copy by hand */
      }
    } catch {
      setError("share");
    } finally {
      setBusy(null);
    }
  };

  const removeLink = async () => {
    if (!share) return;
    await table("share_links")
      .add({ url: share.url, file_name: fileNameFor(b), page_count: b.plan.total, action: "remove requested", remove_by: new Date().toISOString().slice(0, 10) })
      .catch(() => {});
    b.setShare({ ...share, removed: true });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
      toast.success("Share link copied");
    } catch {
      toast.error("Copy did not work. Select the link and copy it.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="order-2 lg:order-1 lg:col-span-5">
        <PreviewStrip b={b} maxHeight="max-h-[480px]" />
      </div>

      <div className="order-1 lg:order-2 lg:col-span-7">
        <div className="rounded-[20px] border border-line p-5 md:p-7">
          <h2 className="t-section text-ink">{COPY.ready}</h2>
          <p className="mt-2 text-muted tabular-nums">
            {b.ready.length} {b.ready.length === 1 ? "file" : "files"} · {b.plan.total} {b.plan.total === 1 ? "page" : "pages"}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={download} disabled={!!busy || !b.plan.total} className="flex-1">
              {busy === "download" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
              {busy === "download" ? "Building PDF" : COPY.download}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={createLink}
              disabled={!!busy || !b.plan.total}
              className="flex-1 border-primary text-primary"
            >
              {busy === "share" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Link2 className="h-5 w-5" aria-hidden="true" />}
              {busy === "share" ? "Creating link" : COPY.share}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="mt-4 flex flex-wrap items-center gap-2 text-[15px] text-ink">
              {COPY.errExport.replace(" Retry.", "")}
              <button
                type="button"
                onClick={error === "share" ? createLink : download}
                className="min-h-11 font-semibold text-primary underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          ) : null}

          {share ? (
            <div className="mt-6 rounded-[16px] bg-surface p-4" role="status">
              {share.removed ? (
                <p className="text-[15px] text-ink">
                  Link removed from this packet. We have asked for the shared file to be deleted.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 t-label text-primary-ink">
                      <Check className="h-4 w-4" aria-hidden="true" /> {COPY.active}
                    </span>
                    <span className="t-meta tabular-nums text-muted">Removed on {formatDate(expires)}</span>
                  </div>
                  <label htmlFor="share-url" className="sr-only">Share link</label>
                  <div className="mt-3 flex gap-2">
                    <input
                      id="share-url"
                      readOnly
                      value={share.url}
                      onFocus={(e) => e.target.select()}
                      className="h-12 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-3 text-[14px] text-ink"
                    />
                    <button type="button" onClick={copy} aria-label="Copy share link" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-line bg-bg hover:border-primary hover:text-primary">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <button type="button" onClick={removeLink} className="press mt-3 min-h-11 rounded-full px-1 t-label text-ink underline underline-offset-2 hover:text-accent">
                    {COPY.removeLink}
                  </button>
                </>
              )}
            </div>
          ) : null}

          <p className="mt-6 t-meta text-muted">
            Check the packet against your court's rules before filing. This tool does not provide legal advice or promise court acceptance.
          </p>
        </div>
      </div>
    </div>
  );
}
