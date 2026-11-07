import { useId } from "react";
import { cn } from "@wron/kit";

// Labelled input / textarea. Always pass `name`.
export default function Field({ label, name, type = "text", textarea, hint, className, ...rest }) {
  const id = useId();
  const input =
    "w-full rounded-[14px] border border-line bg-bg px-4 text-[16px] text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="t-label text-ink">{label}</label>
      {textarea ? (
        <textarea id={id} name={name} rows={4} className={cn(input, "py-3")} {...rest} />
      ) : (
        <input id={id} name={name} type={type} className={cn(input, "h-12")} {...rest} />
      )}
      {hint ? <p className="t-meta text-muted">{hint}</p> : null}
    </div>
  );
}
