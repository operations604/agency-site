import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import Logo from "./Logo";
import BookCallButton from "../ui/BookCallButton";

const LINKS = [
  { label: "What we build", href: "#what-we-build" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Book a call", href: "#book" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`relative transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-[hsl(220_40%_98%/0.85)] backdrop-blur-md"
            : "border-b border-transparent bg-gradient-to-b from-[hsl(220_40%_98%/0.65)] to-transparent backdrop-blur-[3px]"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-[14px] font-medium text-[hsl(222_10%_30%)] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100"
              >
                {link.label}
              </a>
            ))}
          </div>
          <BookCallButton className="px-4 py-2 text-[14px]">
            Book a call
          </BookCallButton>
        </nav>
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-primary/70"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </motion.header>
  );
}
