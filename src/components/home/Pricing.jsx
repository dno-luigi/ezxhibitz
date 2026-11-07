import { useState } from "react";
import { Reveal, useDisclosure, cn } from "@wron/kit";
import Button from "../Button";
import StartPacketButton from "../StartPacketButton";
import PackRequest from "./PackRequest";
import { Segmented } from "./ui";
import { PAY_PLANS, REGULAR, PRO, FOUNDER, PACKET_RULES } from "../../data/plans";
import { SECTIONS } from "../../data/business";

function PlanCard({ name, price, unit, note, extra, top, action, tab, tone = "surface" }) {
  return (
    <Reveal y={10} className="h-full">
      <div
        className={cn(
          "relative flex h-full flex-col rounded-[20px] p-6 md:p-8",
          tone === "outline" && "border border-line bg-bg",
          tone === "surface" && "bg-surface",
          tone === "feature" && "border-2 border-primary bg-bg"
        )}
      >
        {tab ? <span aria-hidden="true" className="absolute right-8 top-0 h-5 w-8 rounded-b-[3px] bg-accent" /> : null}
        <p className="text-[20px] font-semibold text-ink">{name}</p>
        {top}
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[48px] font-[650] leading-none tracking-[-0.03em] text-ink tabular-nums md:text-[56px]">{price}</span>
          {unit ? <span className="text-[17px] text-muted">{unit}</span> : null}
        </p>
        <p className="mt-4 text-muted">{note}</p>
        {extra ? <p className="mt-2 t-label text-primary">{extra}</p> : null}
        <div className="mt-auto pt-8">{action}</div>
      </div>
    </Reveal>
  );
}

export default function Pricing() {
  const dialog = useDisclosure();
  const [chosen, setChosen] = useState(null);
  const [cycle, setCycle] = useState("year");

  const choose = (plan) => {
    setChosen(plan);
    dialog.onOpen();
  };
  const pro = PRO[cycle];

  return (
    <section id={SECTIONS.pricing} className="scroll-mt-20 bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <Reveal y={10}>
          <h2 className="t-section text-ink">Simple pricing</h2>
          <p className="mt-3 max-w-xl text-muted">Pay for one packet, or get access for the year.</p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
          {PAY_PLANS.map((p) => (
            <PlanCard
              key={p.id}
              tone={p.kind === "start" ? "outline" : "surface"}
              name={p.name}
              price={p.price}
              unit={p.unit}
              note={p.note}
              action={
                p.kind === "start" ? (
                  <StartPacketButton size="lg" className="w-full">{p.action}</StartPacketButton>
                ) : (
                  <Button size="lg" className="w-full" onClick={() => choose({ id: p.id, name: p.name, label: p.label })}>{p.action}</Button>
                )
              }
            />
          ))}
        </div>

        <Reveal y={10}>
          <h3 className="mt-12 text-[24px] font-[650] tracking-[-0.02em] text-ink md:mt-16 md:text-[28px]">Access plans</h3>
        </Reveal>
        <div className="mt-6 grid gap-4 md:gap-6 lg:grid-cols-3">
          <PlanCard
            name={REGULAR.name}
            price={REGULAR.price}
            unit={REGULAR.unit}
            note={REGULAR.note}
            extra={REGULAR.extra}
            action={
              <Button size="lg" className="w-full" onClick={() => choose({ id: REGULAR.id, name: REGULAR.name, label: REGULAR.label })}>
                {REGULAR.action}
              </Button>
            }
          />
          <PlanCard
            name={PRO.name}
            price={pro.price}
            unit={pro.unit}
            note={PRO.note}
            extra={cycle === "year" ? PRO.yearNote : null}
            top={
              <div className="mt-3">
                <Segmented
                  label="Billing period"
                  value={cycle}
                  onChange={setCycle}
                  options={[
                    { value: "month", label: "Monthly" },
                    { value: "year", label: "Yearly" },
                  ]}
                />
              </div>
            }
            action={
              <Button size="lg" className="w-full" onClick={() => choose({ id: `${PRO.id}-${cycle}`, name: PRO.name, label: pro.label })}>
                {PRO.action}
              </Button>
            }
          />
          <PlanCard
            tone="feature"
            tab
            name={FOUNDER.name}
            price={FOUNDER.price}
            unit={FOUNDER.unit}
            note={FOUNDER.note}
            action={
              <Button size="lg" className="w-full" onClick={() => choose({ id: FOUNDER.id, name: FOUNDER.name, label: FOUNDER.label })}>
                {FOUNDER.action}
              </Button>
            }
          />
        </div>

        <Reveal y={10}>
          <h3 className="mt-12 text-[24px] font-[650] tracking-[-0.02em] text-ink md:mt-16 md:text-[28px]">What counts as a packet</h3>
        </Reveal>
        <ul className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {PACKET_RULES.map((r, i) => (
            <li key={r.title} className="relative rounded-[20px] border border-line bg-bg p-6">
              {i === 0 ? <span aria-hidden="true" className="absolute right-6 top-0 h-4 w-6 rounded-b-[3px] bg-accent" /> : null}
              <h4 className="t-card text-ink">{r.title}</h4>
              <p className="mt-2 text-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <PackRequest key={chosen?.id || "none"} open={dialog.open} onClose={dialog.onClose} plan={chosen} />
    </section>
  );
}
