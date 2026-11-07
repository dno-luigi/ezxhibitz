import PaperStack from "../PaperStack";
import { COPY } from "../../data/business";

// After the first file, the hero contracts into this band and the builder takes over.
export default function CompactBand() {
  return (
    <section className="rise-in mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 pb-3 pt-5 sm:px-6 md:pt-8">
      <div className="min-w-0">
        <h1 className="text-[24px] font-[650] leading-[1.1] tracking-[-0.03em] text-ink md:text-[30px]">
          {COPY.heroTitle}
        </h1>
        <p className="mt-1 t-label font-normal text-primary">{COPY.freeNote}</p>
      </div>
      <PaperStack oval={false} className="!w-[88px] shrink-0 md:!w-[120px]" label="Your packet" />
    </section>
  );
}
