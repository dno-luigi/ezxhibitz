import { Dialog, Img, useForm, SpamTrap } from "@wron/kit";
import { CheckCircle2 } from "lucide-react";
import Button from "../Button";
import Field from "../Field";
import { CASH_APP_QR } from "../../data/business";

// No payment account is connected, so a visitor sends a request and the owner replies.
// Mount with key={plan.id} so each plan starts with a fresh form.
export default function PackRequest({ open, onClose, plan }) {
  const form = useForm("pack-request");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={plan ? `Get ${plan.name.toLowerCase()}` : "Choose a plan"}
      panelClassName="bg-bg rounded-[20px] max-w-md w-[92vw] max-h-[90vh] overflow-y-auto p-6"
    >
      {form.sent ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="t-card text-ink">Request sent</p>
          <p className="text-muted">We will email you to confirm: {plan?.label}.</p>
          <Button onClick={onClose} className="mt-2">Close</Button>
        </div>
      ) : (
        <form onSubmit={form.onSubmit} className="flex flex-col gap-4">
          <p className="text-muted">
            Online checkout is not open yet. Pay with Cash App, or just send the request and we will email you how to pay.
          </p>
          <p className="rounded-[14px] bg-surface px-4 py-3 text-[16px] font-semibold tabular-nums text-ink">{plan?.label}</p>
          <div className="flex items-center gap-4 rounded-[16px] bg-surface p-4">
            <Img src={CASH_APP_QR} alt="Cash App QR code for paying" ratio="1/1" className="w-32 shrink-0 rounded-[12px] bg-white" imgClassName="object-contain" />
            <p className="text-[15px] text-ink">
              Scan with your phone camera or Cash App. Then send this request so we can match your payment to your email.
            </p>
          </div>
          <input type="hidden" name="plan" value={plan?.label || ""} />
          <Field label="Name" name="name" autoComplete="name" required />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Anything we should know? (optional)" name="message" textarea />
          <SpamTrap />
          {form.error ? <p role="alert" className="text-[15px] text-accent">{String(form.error)}</p> : null}
          <Button type="submit" size="lg" disabled={form.sending}>
            {form.sending ? "Sending" : "Send my request"}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
