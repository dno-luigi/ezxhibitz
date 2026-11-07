import { Info } from "lucide-react";
import DropZone from "./DropZone";
import HeroStack from "./HeroStack";
import { COPY } from "../../data/business";

export default function Hero({ onPick, onFiles, settled, onSettle, deletedNote }) {
  return (
    <section className="mx-auto max-w-page overflow-x-clip px-5 pb-4 pt-14 md:px-6 md:pb-16 md:pt-16 lg:px-10 lg:py-20">
      <div className="grid items-center gap-0 lg:grid-cols-12 lg:gap-12">
        <div className="text-center lg:col-span-6 lg:text-left">
          <h1 className="t-hero mx-auto max-w-[36rem] text-[42px] leading-[1] tracking-[-0.04em] text-ink md:text-[60px] md:leading-[1.02] lg:mx-0">
            {COPY.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-[32rem] text-[20px] leading-7 text-muted md:text-[20px] md:leading-[1.5] lg:mx-0">{COPY.heroLine}</p>
          <p className="mt-5 text-[16px] font-semibold text-primary">{COPY.freeNote}</p>

          {deletedNote ? (
            <p role="status" className="mx-auto mt-5 flex max-w-[520px] items-start gap-2 text-left lg:mx-0 rounded-[14px] border border-line bg-bg p-3 text-[15px] text-ink">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="font-semibold">{COPY.deleted}</strong> Your last packet's files were removed from this device.
              </span>
            </p>
          ) : null}

          <DropZone id="start" onPick={onPick} onFiles={onFiles} onDragStart={onSettle} className="mx-auto mt-6 min-h-[290px] max-w-[520px] p-8 lg:mx-0 lg:max-w-none" />
        </div>

        <div className="lg:col-span-6">
          <HeroStack settled={settled} />
        </div>
      </div>
    </section>
  );
}
