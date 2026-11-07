import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Menu, X, Phone, Mail } from "lucide-react";
import { Sheet, useDisclosure, scrollToSection, CookieSettingsLink } from "@wron/kit";
import StartPacketButton from "./StartPacketButton";
import { BUSINESS, NAV } from "../data/business";

export function useGoToSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (id) => {
    if (pathname === "/") {
      scrollToSection(id);
    } else {
      navigate("/");
      setTimeout(() => scrollToSection(id), 120);
    }
  };
}

function Header() {
  const menu = useDisclosure();
  const goTo = useGoToSection();
  const { pathname } = useLocation();
  const legalNav =
    pathname === "/privacy"
      ? [{ label: "Home", to: "/" }, { label: "Terms", to: "/terms" }]
      : pathname === "/terms"
      ? [{ label: "Home", to: "/" }, { label: "Privacy", to: "/privacy" }]
      : null;

  return (
    <>
      <header className="relative z-50 w-full border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-4 px-4 sm:px-6 md:h-[72px] lg:px-10">
          <Link
            to="/"
            aria-label="EZ EXHIBITZ, home"
            className="min-w-0 truncate text-[18px] font-bold tracking-[-0.02em] text-ink md:text-[20px]"
          >
            {BUSINESS.name}
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {legalNav
              ? legalNav.map((l) => (
                  <Link key={l.to} to={l.to} className="t-label rounded-full px-4 py-3 text-muted transition-colors hover:bg-surface hover:text-ink">
                    {l.label}
                  </Link>
                ))
              : null}
            {(legalNav ? [] : NAV).map((item) => (
              <a
                key={item.id}
                href={`/#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(item.id);
                }}
                className="t-label rounded-full px-4 py-3 text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            {legalNav ? null : (
              <a
                href={BUSINESS.phoneHref}
                className="t-label tabular-nums text-muted transition-colors hover:text-primary"
              >
                {BUSINESS.phoneDisplay}
              </a>
            )}
            <StartPacketButton size="sm" />
          </div>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <StartPacketButton size="sm" className="px-5">Start</StartPacketButton>
            <button
              type="button"
              onClick={menu.onOpen}
              aria-label="Open menu"
              className="press -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menu.open} onClose={menu.onClose} side="right" panelClassName="bg-bg w-[86%] max-w-sm">
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold tracking-[-0.02em] text-ink">{BUSINESS.name}</span>
            <button
              type="button"
              onClick={menu.onClose}
              aria-label="Close menu"
              className="press inline-flex h-12 w-12 items-center justify-center rounded-full hover:bg-surface"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <StartPacketButton size="lg" className="mt-6 w-full" onDone={menu.onClose} />

          <nav aria-label="Mobile" className="mt-6 flex flex-col">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  menu.onClose();
                  goTo(item.id);
                }}
                className="flex h-14 items-center border-b border-line text-left text-[18px] font-medium text-ink hover:text-primary"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <a href={BUSINESS.phoneHref} className="flex h-12 items-center gap-3 text-[16px] text-ink hover:text-primary tabular-nums">
              <Phone className="h-5 w-5 text-primary" /> {BUSINESS.phoneDisplay}
            </a>
            <a href={BUSINESS.emailHref} className="flex h-12 items-center gap-3 text-[16px] text-ink hover:text-primary">
              <Mail className="h-5 w-5 text-primary" /> {BUSINESS.email}
            </a>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 md:py-16 lg:px-10">
        <div className="md:col-span-6">
          <Link to="/" className="text-[20px] font-bold tracking-[-0.02em] text-ink">
            {BUSINESS.name}
          </Link>
          <p className="mt-2 text-muted">{BUSINESS.short}</p>
        </div>
        <div className="flex flex-col items-start gap-4 md:col-span-6 md:items-end">
          <StartPacketButton />
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="t-label inline-flex min-h-11 items-center text-muted hover:text-primary">
              Privacy
            </Link>
            <Link to="/terms" className="t-label inline-flex min-h-11 items-center text-muted hover:text-primary">
              Terms
            </Link>
            <CookieSettingsLink className="t-label inline-flex min-h-11 items-center text-muted hover:text-primary">
              Cookie settings
            </CookieSettingsLink>
          </nav>
        </div>
        <p className="border-t border-line pt-6 text-[14px] text-muted md:col-span-12">
          {BUSINESS.limitation}
        </p>
      </div>
    </footer>
  );
}

function LegalFooter({ links }) {
  return (
    <footer className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
      <nav aria-label="Legal" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line pb-12 pt-6 md:mt-16 md:gap-x-12 md:pb-20 md:pt-8">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="t-label inline-flex min-h-11 items-center text-muted hover:text-primary">
            {l.label}
          </Link>
        ))}
        <CookieSettingsLink className="t-label inline-flex min-h-11 items-center text-muted hover:text-primary">
          Cookie settings
        </CookieSettingsLink>
      </nav>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const legalLinks =
    pathname === "/privacy"
      ? [{ label: "Home", to: "/" }, { label: "Terms", to: "/terms" }]
      : pathname === "/terms"
      ? [{ label: "Home", to: "/" }, { label: "Privacy", to: "/privacy" }]
      : null;
  return (
    <div className="min-h-screen bg-bg font-body text-ink">
      <Header />
      <Outlet />
      {legalLinks ? <LegalFooter links={legalLinks} /> : <Footer />}
    </div>
  );
}
