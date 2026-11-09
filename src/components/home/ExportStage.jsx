import { useEffect, useState } from "react";
import { Check, Copy, Download, Link2, Loader2 } from "lucide-react";
import { upload, table, toast } from "@wron/kit";
import Button from "../Button";
import PreviewStrip from "./PreviewStrip";
import PackRequest from "./PackRequest";
import { quota } from "../../lib/quota";
import { owner } from "../../lib/owner";
import { formatDate, removalDate } from "../../lib/packet";
import { COPY } from "../../data/business";
import { PAY_PLANS } from "../../data/plans";

const PLAN = PAY_PLANS.find((p) => p.id === "per-packet");

const fileNameFor = (b) => {
  const base = (b.ready[0]?.title || "packet").replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "packet";
  return `${base} packet.pdf`;
};

export default function ExportStage({ b }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [allowance, setAllowance] = useState(null);
  const [buying, setBuying] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeNote, setCodeNote] = useState(null);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerCode, setOwnerCode] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerNote, setOwnerNote] = useState(null);
  const share = b.share;
  const expires = share ? removalDate(share.createdAt, 30) : null;
  const blocked = allowance ? allowance.allowed === false : false;
  // The server decides the role and names it in every reply; the page only shows it.
  const isOwner = allowance?.role === "owner";

  // Building and previewing need no server; this only says whether an export can go.
  useEffect(() => {
    let live = true;
    quota
      .status(b)
      .then((next) => live && setAllowance(next))
      .catch(() => {});
    return () => {
      live = false;
    };
    // Once per visit to the export step: the export itself re-checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Count this export on the server. False means no packet is available. */
  const takePacket = async () => {
    const next = await quota.consume(b);
    setAllowance(next);
    return next.allowed !== false;
  };

  const download = async () => {
    setError(null);
    setBusy("download");
    try {
      const blob = await b.build();
      if (!(await takePacket())) return;
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
      if (!(await takePacket())) return;
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

  const redeem = async () => {
    setRedeeming(true);
    setCodeNote(null);
    try {
      const next = await quota.redeem(code);
      setAllowance(next);
      setCode("");
      toast.success(COPY.codeOk);
    } catch (err) {
      setCodeNote(err?.message || COPY.codeBad);
    } finally {
      setRedeeming(false);
    }
  };

  /** Re-read the role and the allowance after a sign-in or sign-out. */
  const refreshAllowance = async () => {
    const next = await quota.status(b).catch(() => null);
    if (next) setAllowance(next);
  };

  const ownerSignIn = async () => {
    setOwnerBusy(true);
    setOwnerNote(null);
    try {
      await owner.signIn(ownerCode.trim());
      setOwnerCode("");
      setOwnerOpen(false);
      await refreshAllowance();
      toast.success(COPY.ownerOk);
    } catch (err) {
      setOwnerNote(err?.message || COPY.ownerBad);
    } finally {
      setOwnerBusy(false);
    }
  };

  const ownerSignOut = async () => {
    setOwnerBusy(true);
    setOwnerNote(null);
    try {
      await owner.signOut();
    } catch {
      /* already signed out, or this visit never signed in */
    }
    await refreshAllowance();
    setOwnerBusy(false);
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

          {blocked ? (
            <div className="mt-6 rounded-[16px] border border-line bg-surface p-4">
              <p className="t-card text-ink">{COPY.payTitle}</p>
              <p className="mt-2 text-muted">{COPY.payBody}</p>
              <Button size="lg" onClick={() => setBuying(true)} className="mt-4 w-full sm:w-auto">
                {PLAN?.action}
              </Button>

              <div className="mt-5 border-t border-line pt-4">
                <label htmlFor="unlock-code" className="t-label text-ink">
                  {COPY.payCode}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="unlock-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeNote(null);
                    }}
                    autoComplete="off"
                    spellCheck="false"
                    className="h-12 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-3 text-[15px] uppercase tracking-wide text-ink"
                  />
                  <Button variant="outline" onClick={redeem} disabled={!code.trim() || redeeming}>
                    {redeeming ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
                    {COPY.codeApply}
                  </Button>
                </div>
                {codeNote ? (
                  <p role="alert" className="mt-2 text-[15px] text-accent">
                    {codeNote}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <>
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
              {allowance && allowance.used === 0 && allowance.credits === 0 ? (
                <p className="mt-3 t-meta text-muted">{COPY.freeNote}</p>
              ) : null}
            </>
          )}

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

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4">
            {isOwner ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 t-label text-primary">
                  <Check className="h-4 w-4" aria-hidden="true" /> {COPY.ownerBadge}
                </span>
                <span className="t-meta text-muted">{COPY.ownerNote}</span>
                <button
                  type="button"
                  onClick={ownerSignOut}
                  disabled={ownerBusy}
                  className="ml-auto min-h-11 t-label text-ink underline underline-offset-2 hover:text-accent"
                >
                  {COPY.ownerSignOut}
                </button>
              </>
            ) : ownerOpen ? (
              <div className="w-full">
                <label htmlFor="owner-code" className="t-label text-ink">
                  {COPY.ownerCode}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="owner-code"
                    type="password"
                    value={ownerCode}
                    onChange={(e) => {
                      setOwnerCode(e.target.value);
                      setOwnerNote(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && ownerCode.trim() && !ownerBusy) ownerSignIn();
                    }}
                    autoComplete="off"
                    spellCheck="false"
                    className="h-12 min-w-0 flex-1 rounded-[12px] border border-line bg-bg px-3 text-[15px] tracking-wide text-ink"
                  />
                  <Button variant="outline" onClick={ownerSignIn} disabled={!ownerCode.trim() || ownerBusy}>
                    {ownerBusy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
                    {COPY.ownerGo}
                  </Button>
                </div>
                {ownerNote ? (
                  <p role="alert" className="mt-2 text-[15px] text-accent">
                    {ownerNote}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOwnerOpen(true)}
                className="min-h-11 t-meta text-muted underline underline-offset-2 hover:text-primary"
              >
                {COPY.ownerSignIn}
              </button>
            )}
          </div>

          <p className="mt-6 t-meta text-muted">
            Check the packet against your court's rules before filing. This tool does not provide legal advice or promise court acceptance.
          </p>
        </div>
      </div>

      {PLAN ? (
        <PackRequest key={PLAN.id} open={buying} onClose={() => setBuying(false)} plan={{ id: PLAN.id, name: PLAN.name, label: PLAN.label }} />
      ) : null}
    </div>
  );
}
