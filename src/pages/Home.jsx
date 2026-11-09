import { Page } from "@wron/kit";
import Workspace from "../components/home/Workspace";
import Steps from "../components/home/Steps";
import MobileSection from "../components/home/MobileSection";
import Pricing from "../components/home/Pricing";
import SecurityAudience from "../components/home/SecurityAudience";
import Contact from "../components/home/Contact";
import { BUSINESS } from "../data/business";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: BUSINESS.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any modern web browser",
  description:
    "Add PDFs, images and Word files, arrange and label exhibits, then export one PDF packet. For solo lawyers, paralegals and pro se filers.",
  email: BUSINESS.email,
  telephone: "+1-858-876-5295",
  offers: [
    { "@type": "Offer", name: "First 3 packets", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Per packet", price: "7.99", priceCurrency: "USD" },
    { "@type": "Offer", name: "Personal access, per year", price: "99", priceCurrency: "USD" },
    { "@type": "Offer", name: "Professional access, per month", price: "39", priceCurrency: "USD" },
    { "@type": "Offer", name: "Professional access, per year", price: "390", priceCurrency: "USD" },
    { "@type": "Offer", name: "Founder access, 3 years", price: "199", priceCurrency: "USD" },
  ],
};

export default function Home() {
  return (
    <Page
      title="Build exhibit packets in one PDF"
      description="Add PDFs, images and Word files, arrange and label your exhibits, preview, then export one clean PDF packet. Your first three packets are free."
      jsonLd={jsonLd}
    >
      <Workspace />
      <Steps />
      <MobileSection />
      <Pricing />
      <SecurityAudience />
      <Contact />
    </Page>
  );
}
