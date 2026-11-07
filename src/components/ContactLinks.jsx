import { Phone, Mail } from "lucide-react";
import { cn } from "@wron/kit";
import { BUSINESS } from "../data/business";

// Two large outlined contact links (phone, email). Big tap targets on phones.
export default function ContactLinks({ className }) {
  const item =
    "press group flex min-h-14 items-center gap-3 rounded-full border border-line bg-bg px-6 text-[17px] font-medium text-ink hover:border-primary hover:text-primary";
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      <a href={BUSINESS.phoneHref} className={cn(item, "tabular-nums")}>
        <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
        {BUSINESS.phoneDisplay}
      </a>
      <a href={BUSINESS.emailHref} className={cn(item, "break-all")}>
        <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
        {BUSINESS.email}
      </a>
    </div>
  );
}
