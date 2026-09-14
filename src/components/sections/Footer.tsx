import Logo from "../nav/Logo";
import { goToBooking } from "../../lib/goto-booking";

const LINKS = [
  { label: "What we build", href: "#what-we-build" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Book a call", href: "#book" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[320px]">
          <Logo />
          <p className="mt-4 text-[15px] leading-[1.6] text-[hsl(222_10%_45%)]">
            We design, build, and run custom software automations for the work
            that eats your team's time.
          </p>
          <a
            href="mailto:operations@appliedsystem.org"
            className="mt-3 inline-block text-[15px] font-medium text-foreground transition-colors hover:text-primary"
          >
            operations@appliedsystem.org
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
            Explore
          </span>
          <nav className="flex flex-col gap-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[15px] text-[hsl(222_10%_35%)] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
            Get started
          </span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={goToBooking}
            className="inline-flex w-fit items-center rounded-xl bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Book a call
          </button>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1200px] border-t border-border px-5 pt-6 sm:px-8">
        <p className="font-mono-label text-[11px] text-[hsl(222_10%_55%)]">
          © {new Date().getFullYear()} Applied Systems. Built around your
          business.
        </p>
      </div>
    </footer>
  );
}
