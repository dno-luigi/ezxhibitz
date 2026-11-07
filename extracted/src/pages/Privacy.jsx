import { Page } from "@wron/kit";
import { LegalHeader, LegalRow, LegalContact } from "../components/Legal";
import SharingExample from "../components/privacy/SharingExample";

export default function Privacy() {
  return (
    <Page
      title="Privacy"
      description="How EZ EXHIBITZ handles the files you upload: what is remembered, how long files are kept, and how share links work."
    >
      <LegalHeader
        title="Privacy"
        intro="EZ EXHIBITZ processes the files you upload to build, preview, export and share a packet."
      />
      <LegalRow title="Files and settings">
        <p>Uploads can include PDFs, images and Word files. Identifier style and last export settings are remembered.</p>
      </LegalRow>
      <section className="mx-auto max-w-[1280px] px-5 pb-8 sm:px-8 lg:px-12">
        <div className="w-full rounded-theme border border-dashed border-line bg-surface p-6 md:min-h-[255px] md:px-12 md:py-10">
          <h2 className="t-label text-muted">Security and retention</h2>
          <p className="mt-4 text-[26px] font-[650] leading-[1.2] tracking-[-0.02em] text-ink md:text-[32px]">
            Files are encrypted.
          </p>
          <p className="mt-3 text-[26px] font-[650] leading-[1.2] tracking-[-0.02em] text-ink md:text-[32px]">
            Files are deleted after 30 days.
          </p>
        </div>
      </section>
      <LegalRow title="Sharing">
        <p>When you create a share link, the packet shows the date it will be removed. You can remove the link earlier.</p>
        <SharingExample />
      </LegalRow>
      <LegalContact />
    </Page>
  );
}
