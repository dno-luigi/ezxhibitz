import { Reveal, scrollToSection } from "@wron/kit";
import { Smartphone, GripVertical, Share2 } from "lucide-react";
import Button from "../Button";
import StartPacketButton from "../StartPacketButton";
import { BUSINESS, COPY } from "../../data/business";

const CARDS = [
  { icon: Smartphone, title: "Add your files", body: "Bring your main document, exhibits, attachments, and photos together from your phone." },
  {
    icon: GripVertical,
    title: "Arrange it your way",
    body: "Drag files into order. Resize images. Put multiple images on a page or let one exhibit span several pages. Choose letters, numbers, and the labels that fit your packet.",
  },
  { icon: Share2, title: "Preview and send", body: "Check every page, then download one PDF or send a share link." },
];

function PhoneMock() {
  const rows = [
    { label: "Main document", bar: "bg-primary" },
    { label: "Exhibit A", bar: "bg-accent" },
    { label: "Exhibit B", bar: "bg-primary" },
  ];
  return (
    <div aria-hidden="true" className="mx-auto w-[240px] rounded-[36px] border-[6px] border-ink bg-bg p-3 shadow-[0_30px_50px_-30px_rgba(15,32,25,0.45)]">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-line" />
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="relative flex items-center gap-2 overflow-hidden rounded-[12px] border border-line bg-bg py-2.5 pl-4 pr-2">
            <span className={`absolute inset-y-0 left-0 w-1 ${r.bar}`} />
            <span className="flex-1 text-[13px] font-medium text-ink">{r.label}</span>
            <GripVertical className="h-4 w-4 text-muted" />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-4 aspect-[8.5/11] w-24 rounded-[4px] border border-line bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-1.5 pt-3">
          {[90, 80, 86, 60, 84, 70, 76].map((w, k) => (
            <span key={k} className="block h-[3px] rounded bg-[#E2E6E4]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <span className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-ink">{COPY.download}</span>
    </div>
  );
}

export default function MobileSection() {
  return (
    <section id="mobile" className="scroll-mt-20 bg-bg pt-14 md:pt-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <Reveal y={10}>
          <div className="grid items-center gap-10 rounded-[24px] bg-surface p-6 md:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
            <div className="lg:col-span-7">
              <h2 className="t-section text-ink">Your phone. Your files. One finished packet.</h2>
              <p className="mt-4 text-[19px] font-medium text-ink">
                Build an organized exhibit packet in minutes, without opening your laptop.
              </p>
              <p className="mt-3 max-w-xl text-muted">
                Drop in PDFs, Word documents, and images. Drag them into order, adjust your layouts, and let {BUSINESS.name} handle the exhibit separators and page numbering. Preview, export, and get on with your day.
              </p>
              <p className="mt-5 text-[17px] font-semibold text-primary">Made for mobile. Built around the work.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <StartPacketButton size="lg">Make a packet</StartPacketButton>
                <Button variant="outline" size="lg" onClick={() => scrollToSection("pricing")}>See pricing</Button>
              </div>
              <p className="mt-5 t-label font-normal text-muted">We are always improving it.</p>
            </div>
            <div className="lg:col-span-5">
              <PhoneMock />
            </div>
          </div>
        </Reveal>

        <Reveal y={10}>
          <h3 className="mt-12 text-[24px] font-[650] tracking-[-0.02em] text-ink md:text-[28px]">From loose files to ready to send</h3>
        </Reveal>
        <ul className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {CARDS.map((c) => (
            <li key={c.title} className="rounded-[20px] border border-line bg-bg p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h4 className="t-card mt-4 text-ink">{c.title}</h4>
              <p className="mt-2 text-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
