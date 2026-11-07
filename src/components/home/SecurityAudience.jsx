import { Check, Lock, Trash2 } from "lucide-react";
import { Reveal } from "@wron/kit";
import { BUSINESS, SECTIONS } from "../../data/business";

const ICONS = [Lock, Trash2];

export default function SecurityAudience() {
  return (
    <section id={SECTIONS.security} className="scroll-mt-20 bg-bg pb-10 md:pb-14">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <Reveal y={10}>
          <div className="grid overflow-hidden rounded-[20px] border border-line md:grid-cols-12">
            <div className="relative bg-primary px-6 pb-8 pt-12 text-primary-ink md:col-span-7 md:px-10 md:pb-12 md:pt-16">
              <span aria-hidden="true" className="absolute left-6 top-0 h-8 w-6 rounded-b-[3px] bg-accent md:left-10" />
              <h2 className="t-section">Clear handling for your files.</h2>
              <ul className="mt-8 flex flex-col">
                {BUSINESS.security.map((s, i) => {
                  const Icon = ICONS[i];
                  return (
                    <li key={s} className={`flex items-center gap-4 py-4 text-[19px] font-medium md:text-[22px] ${i ? "border-t border-white/20" : ""}`}>
                      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {s}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bg-bg px-6 py-8 md:col-span-5 md:px-10 md:py-16">
              <h3 className="text-[22px] font-semibold leading-[1.2] text-ink md:text-[24px]">For the person assembling the packet</h3>
              <ul className="mt-6 flex flex-col">
                {BUSINESS.audience.map((a, i) => (
                  <li key={a} className={`flex min-h-14 items-center gap-4 text-[17px] text-ink ${i ? "border-t border-line" : ""}`}>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
