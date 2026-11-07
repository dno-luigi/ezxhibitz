import { cn } from "@wron/kit";

// Section heading: 40px desktop / 30px phone, weight 650, optional short line.
export default function SectionHeading({ as: Tag = "h2", title, line, className, id }) {
  return (
    <div className={cn("max-w-xl", className)}>
      <Tag id={id} className="t-section text-ink">{title}</Tag>
      {line ? <p className="mt-3 text-muted">{line}</p> : null}
    </div>
  );
}
