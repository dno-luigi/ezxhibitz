// Every owner-given fact lives here. Read it everywhere; never retype these.
export const BUSINESS = {
  name: "EZ EXHIBITZ",
  tagline: "The packet builder that goes where you do.",
  short: "The packet builder that goes where you do. Add, arrange and export one clean PDF packet.",
  phoneDisplay: "858-876-5295",
  phoneHref: "tel:+18588765295",
  email: "exhibitz@nspired.cc",
  emailHref: "mailto:exhibitz@nspired.cc",
  audience: ["Solo lawyers", "Paralegals", "Pro se filers"],
  security: ["Files are encrypted.", "Files are deleted after 30 days."],
  retentionDays: 30,
  limitation: "This tool does not provide legal advice or promise court acceptance.",
};

// The owner's own Cash App QR code, shown unchanged in the "Buy 20 packets" window.
export const CASH_APP_QR =
  "https://firebasestorage.googleapis.com/v0/b/wron-ai.firebasestorage.app/o/site-library%2FdvqIQH6dxgSVb1U9QpTyOyNjH093%2Fsite-1793834947009%2Fupload-ab60dbab-2377-4438-84f5-d05799976cfb.png?alt=media&token=74306c15-a9c3-4d8d-831f-d6cbd6ac80ed";

// Generated still of the settled paper stack (share picture / 3D poster).
export const HERO_STILL =
  "https://firebasestorage.googleapis.com/v0/b/wron-ai.firebasestorage.app/o/site-assets%2Fsite-1793834947009%2Fb67bac5f-a293-44b9-86f8-f143ee50a8db.webp?alt=media&token=17743003-4b27-4492-bbc7-5dc9ba13ffdc";

// Section ids on the home page (header links point here).
export const SECTIONS = {
  builder: "builder",
  how: "how-it-works",
  pricing: "pricing",
  security: "security",
  contact: "contact",
};

export const NAV = [
  { label: "How it works", id: SECTIONS.how },
  { label: "Pricing", id: SECTIONS.pricing },
  { label: "Security", id: SECTIONS.security },
];

// Accepted uploads: PDF, images and Word files.
export const ACCEPT =
  ".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.gif,.webp,.heic,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const STEPS = [
  { n: 1, title: "Add", body: "Drop in your main document, exhibits and attachments." },
  { n: 2, title: "Arrange", body: "Drag, rename and add identifiers." },
  { n: 3, title: "Export", body: "Preview, download one PDF or create a share link." },
];

// Exact interface wording from the direction.
export const COPY = {
  heroTitle: "Dump your junk in the trunk!",
  heroLine: "The packet builder that goes where you do. Add PDFs, images and Word files, then arrange, label and export one clean packet.",
  freeNote: "Your first packet is free.",
  dropTitle: "Drop your main document and exhibits here.",
  dropNote: "PDF, images and Word files.",
  choose: "Choose files",
  start: "Start a packet",
  rail: ["Add", "Arrange", "Export"],
  addTitle: "Add your files",
  mainDoc: "Main document",
  addExhibits: "Add exhibits and attachments",
  mainOnly: "Main document added. Add exhibits when ready.",
  outline: "Packet outline",
  identifiers: "Identifiers",
  letters: "Letters",
  numbers: "Numbers",
  prefix: "Prefix",
  slipSheets: "Slip sheets",
  pageNumbers: "Page numbers",
  position: "Position",
  preview: "Preview",
  ready: "Your packet is ready",
  download: "Download PDF",
  share: "Create share link",
  active: "Active",
  removeLink: "Remove link",
  saved: "Saved",
  removed: "Item removed",
  undo: "Undo",
  errUnsupported: "This file type is not supported. Add a PDF, image or Word file.",
  errPassword: "WRON_SECRET_REMOVED",
  errUnreadable: "This file could not be read. The rest of your packet is unchanged.",
  errPreview: "Preview is unavailable. Your work is kept. Retry.",
  errExport: "Export is unavailable. Your work is kept. Retry.",
  deleted: "Deleted after 30 days.",
};
