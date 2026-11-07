import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@wron/kit";
import Button from "../Button";
import { COPY } from "../../data/business";

// The real entry point: drop files on it or pick them from the device.
export default function DropZone({ onPick, onFiles, onDragStart, id, compact = false, title = COPY.dropTitle, className }) {
  const [over, setOver] = useState(false);
  return (
    <div
      id={id}
      tabIndex={id ? -1 : undefined}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        over ? "border-primary bg-[#E3F0E9]" : "border-primary/25 bg-surface",
        compact ? "gap-2 px-5 py-6" : "gap-3 px-5 py-9 md:py-10",
        className
      )}
    >
      <CloudUpload className={cn("text-primary", compact ? "h-9 w-9" : "h-12 w-12")} strokeWidth={1.6} aria-hidden="true" />
      <p className="text-xl font-semibold text-ink md:text-[19px]">{over ? "Drop to add them" : title}</p>
      <p className="t-label font-normal text-muted">{COPY.dropNote}</p>
      <Button size={compact ? "md" : "lg"} onClick={onPick} className={cn("mt-2 w-full max-w-[15rem]", !compact && "max-md:h-14 max-md:max-w-[300px]")}>
        {COPY.choose}
      </Button>
    </div>
  );
}
