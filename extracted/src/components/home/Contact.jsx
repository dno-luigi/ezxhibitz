import { Phone, Mail } from "lucide-react";
import { Reveal } from "@wron/kit";
import { BUSINESS, SECTIONS } from "../../data/business";

export default function Contact() {
  return (
    <section id={SECTIONS.contact} className="scroll-mt-20 bg-bg pb-14 md:pb-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <Reveal y={10}>
          <div className="flex flex-col items-center justify-center rounded-[20px] bg-surface px-6 py-8 text-center md:py-10">
            <h2 className="t-section text-ink">Questions?</h2>
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:gap-8">
              <a href={BUSINESS.phoneHref} className="inline-flex min-h-12 items-center gap-2 text-[18px] font-medium tabular-nums text-ink hover:text-primary">
                <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                {BUSINESS.phoneDisplay}
              </a>
              <a href={BUSINESS.emailHref} className="inline-flex min-h-12 items-center gap-2 break-all text-[18px] font-medium text-ink hover:text-primary">
                <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                {BUSINESS.email}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
