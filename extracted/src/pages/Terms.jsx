import { Page } from "@wron/kit";
import { UploadCloud, Clock } from "lucide-react";
import { LegalHeader, LegalRow, LegalContact } from "../components/Legal";
import { PACKET_RULES } from "../data/plans";

export default function Terms() {
  return (
    <Page
      title="Terms"
      description="Terms for EZ EXHIBITZ: pricing, use, accepted files, 30-day retention and what happens if preview or export is unavailable."
    >
      <LegalHeader
        title="Terms"
        intro="EZ EXHIBITZ lets you add, arrange, preview, export and share document packets."
      />

      <section className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-6 md:min-h-[320px] md:px-12 md:py-12">
          <h2 className="text-4xl font-[650] leading-none tracking-[-0.03em] text-ink md:text-5xl">Pricing</h2>
          <p className="mt-3 text-[19px] text-muted md:text-2xl">Your first packet is free. Each packet after that costs $7.99. Access plans are listed on the home page.</p>
          <div className="mt-8 grid grid-cols-1 items-baseline gap-6 sm:grid-cols-2">
            <div>
              <p className="t-card text-muted">First packet</p>
              <p className="mt-1 text-6xl font-bold leading-none tracking-[-0.03em] text-primary tabular-nums md:text-8xl">$0</p>
            </div>
            <div className="border-t border-line pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <p className="t-card text-muted">Per packet</p>
              <p className="mt-1 text-6xl font-bold leading-none tracking-[-0.03em] text-ink tabular-nums md:text-8xl">
                $7.99
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-12 sm:px-8 lg:px-12">
        <h2 className="text-4xl font-[650] leading-tight tracking-[-0.03em] text-ink md:text-[52px]">What counts as a packet</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {PACKET_RULES.map((r) => (
            <div key={r.title} className="rounded-theme bg-surface p-6 md:p-8">
              <h3 className="t-card text-ink">{r.title}</h3>
              <p className="mt-2 text-muted">{r.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-muted">Personal access includes 60 packets. Founder access includes a higher allowance. Professional access includes a much larger one.</p>
      </section>

      <div className="mx-auto mt-12 max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <div className="h-[2px] w-full rounded bg-accent/60" />
      </div>
      <LegalRow title="Use" noRule>
        <p>Check your packet before filing or sharing. This tool does not provide legal advice or promise court acceptance.</p>
      </LegalRow>

      <section className="mx-auto max-w-[1280px] px-5 pb-12 sm:px-8 lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-theme bg-surface p-6 md:min-h-[380px] md:p-12">
            <UploadCloud className="size-12 text-primary md:size-16" aria-hidden="true" />
            <h2 className="t-card mt-4 text-ink md:text-[38px]">Files</h2>
            <p className="mt-2 text-muted md:text-[24px] md:leading-[1.5]">PDFs, images and Word files are accepted. Files are encrypted and deleted after 30 days.</p>
          </div>
          <div className="rounded-theme bg-surface p-6 md:min-h-[380px] md:p-12">
            <Clock className="size-12 text-primary md:size-16" aria-hidden="true" />
            <h2 className="t-card mt-4 text-ink md:text-[38px]">Availability</h2>
            <p className="mt-2 text-muted md:text-[24px] md:leading-[1.5]">If preview or export is unavailable, your work is kept so you can retry.</p>
          </div>
        </div>
      </section>

      <LegalContact />
    </Page>
  );
}
