import { Page } from "@wron/kit";
import Button from "../components/Button";
import PaperStack from "../components/PaperStack";

export default function NotFound() {
  return (
    <Page title="Page not found" description="This page does not exist. Go back to EZ EXHIBITZ to add, arrange and export one clean PDF packet." noindex>
      <section className="mx-auto grid max-w-page items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-12 md:py-24 lg:px-10">
        <div className="md:col-span-6">
          <h1 className="t-hero text-ink">This page is not in the packet.</h1>
          <p className="mt-4 text-muted">The address may be old or typed wrong.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/" size="lg">Back to the builder</Button>
            <Button to="/privacy" variant="outline" size="lg">Privacy</Button>
            <Button to="/terms" variant="outline" size="lg">Terms</Button>
          </div>
        </div>
        <div className="md:col-span-6">
          <PaperStack className="mx-auto max-w-md" label="A stack of packet pages" />
        </div>
      </section>
    </Page>
  );
}
