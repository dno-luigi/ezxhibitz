// Owner-given pricing. Prices are shown exactly as given.
// "pay" plans are per packet. "access" plans are time-based access.

export const PAY_PLANS = [
  {
    id: "free-1",
    name: "Your first 3 packets",
    price: "Free",
    unit: "",
    note: "Build three full packets at no cost. Separators, page numbers and share link included.",
    action: "Start free",
    kind: "start", // opens the builder's file picker
  },
  {
    id: "per-packet",
    name: "Per packet",
    price: "$7.99",
    unit: "per packet",
    note: "Pay only when you need one. Every packet gets the full set of tools.",
    action: "Buy a packet",
    kind: "request",
    label: "1 packet, $7.99",
  },
];

export const REGULAR = {
  id: "regular",
  name: "Personal access",
  price: "$99",
  unit: "per year",
  note: "For people putting together their own filing.",
  extra: "Includes 60 packets",
  action: "Get personal access",
  label: "Personal access, $99 per year, 60 packets",
};

// What uses a packet. Shown in the pricing section and on the terms page.
export const PACKET_RULES = [
  {
    title: "A new export uses one packet",
    body: "A packet is counted when you successfully export a new packet for the first time.",
  },
  {
    title: "Building is free",
    body: "Uploading files, arranging documents and previewing your work do not use a packet.",
  },
  {
    title: "Seven days of revisions",
    body: "Revisions and re-exports of the same packet are included for seven days. After that, a new export uses another packet.",
  },
];

export const PRO = {
  id: "pro",
  name: "Professional access",
  note: "For lawyers and paralegals who build packets often. Includes a much larger allowance than Personal.",
  action: "Get professional access",
  month: { price: "$39", unit: "per month", label: "Professional access, $39 per month" },
  year: { price: "$390", unit: "per year", label: "Professional access, $390 per year" },
  yearNote: "Yearly costs the same as 10 months.",
};

export const FOUNDER = {
  id: "founder",
  name: "Founder access",
  price: "$199",
  unit: "for 3 years",
  note: "Pay once. You are covered for three years, with a higher allowance than Personal.",
  action: "Become a founder",
  label: "Founder access, $199 for 3 years",
};
