import { cn } from "@wron/kit";
import { BUSINESS } from "../data/business";

// Shared building blocks for /privacy and /terms: one spacious single column.

export function LegalHeader({ title, intro }) {
  return (
    <header className="mx-auto max-w-[1280px] px-5 pt-14 sm:px-8 md:pt-24 lg:px-12">
      <h1 className="text-[52px] font-[650] leading-none tracking-[-0.04em] text-ink md:text-[76px]">{title}</h1>
      <p className="mt-6 max-w-4xl text-[20px] leading-8 text-muted md:text-[30px] md:leading-[1.4]">{intro}</p>
      <div className="mt-10 h-[2px] w-full rounded bg-primary" />
    </header>
  );
}

// Heading stacked above its content, separated by full-width rules.
export function LegalRow({ title, children, className, noRule = false }) {
  return (
    <section className={cn("mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12", className)}>
      <div className={cn("py-12 md:py-20", noRule ? "" : "border-t border-line")}>
        <h2 className="text-4xl font-[650] leading-tight tracking-[-0.03em] text-ink md:text-[52px]">{title}</h2>
        <div className="mt-6 text-[19px] leading-relaxed text-muted md:text-[25px] md:leading-[1.55] [&>p]:max-w-4xl">{children}</div>
      </div>
    </section>
  );
}

export function LegalContact({ title = "Contact" }) {
  return (
    <LegalRow title={title} className="mt-10 md:mt-20">
      <p>
        <a href={BUSINESS.phoneHref} className="tabular-nums hover:text-primary">{BUSINESS.phoneDisplay}</a>
      </p>
      <p>
        <a href={BUSINESS.emailHref} className="break-all hover:text-primary">{BUSINESS.email}</a>
      </p>
    </LegalRow>
  );
}
