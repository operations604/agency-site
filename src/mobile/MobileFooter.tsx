import Logo from "../components/nav/Logo";
import { goToBooking } from "../lib/goto-booking";

const LINKS = [
  { label: "What we build", href: "#what-we-build" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Book a call", href: "#book" },
];

export default function MobileFooter() {
  return (
    <footer className="border-t border-border bg-card px-5 py-12 text-center">
      <div className="mx-auto flex max-w-[400px] flex-col items-center">
        <Logo />
        <p className="mt-4 max-w-[32ch] text-[15px] leading-[1.6] text-[hsl(222_10%_45%)]">
          We design, build, and run custom software automations for the work
          that eats your team's time.
        </p>
        <a
          href="mailto:hello@appliedsystems.com"
          className="mt-3 text-[15px] font-medium text-foreground"
        >
          hello@appliedsystems.com
        </a>

        <span className="mt-8 font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
          Explore
        </span>
        <nav className="mt-3 flex flex-col items-center gap-2.5">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="min-h-11 px-3 text-[15px] text-[hsl(222_10%_35%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <span className="mt-8 font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
          Get started
        </span>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={goToBooking}
          className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Book a call
        </button>
      </div>
      <div className="mx-auto mt-10 max-w-[400px] border-t border-border pt-6">
        <p className="font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
          © {new Date().getFullYear()} Applied Systems. Built around your
          business.
        </p>
      </div>
    </footer>
  );
}
