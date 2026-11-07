import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { Segmented, Toggle, POSITIONS } from "./ui";
import { COPY } from "../../data/business";

export default function IdentifierSettings({ settings, setSettings }) {
  const prefixId = useId();
  const posId = useId();
  return (
    <div className="flex flex-col gap-4">
      <h3 className="t-label text-[16px] text-ink">{COPY.identifiers}</h3>
      <Segmented
        label="Identifier style"
        value={settings.style}
        onChange={(style) => setSettings({ style })}
        options={[
          { value: "letters", label: COPY.letters },
          { value: "numbers", label: COPY.numbers },
        ]}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={prefixId} className="t-label text-ink">{COPY.prefix}</label>
        <input
          id={prefixId}
          value={settings.prefix}
          maxLength={24}
          onChange={(e) => setSettings({ prefix: e.target.value })}
          className="h-12 w-full rounded-[12px] border border-line bg-bg px-4 text-[16px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Toggle label={COPY.slipSheets} checked={settings.slip} onChange={(slip) => setSettings({ slip })} />
      <Toggle label={COPY.pageNumbers} checked={settings.pageNumbers} onChange={(pageNumbers) => setSettings({ pageNumbers })} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={posId} className="t-label text-ink">{COPY.position}</label>
        <div className="relative">
          <select
            id={posId}
            value={settings.position}
            disabled={!settings.pageNumbers}
            onChange={(e) => setSettings({ position: e.target.value })}
            className="h-12 w-full appearance-none rounded-[12px] border border-line bg-bg pl-4 pr-10 text-[16px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
