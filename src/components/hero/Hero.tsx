import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import BookCallButton from "../ui/BookCallButton";
import HeroDemo from "./HeroDemo";

const HEADLINE = "Custom software and automation, built around your business.";

function Headline({ armed }: { armed: boolean }) {
  return (
    <motion.h1
      initial="hidden"
      animate={armed ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="max-w-[640px] text-[2.5rem] leading-[1.05] sm:text-[3.25rem] lg:text-[3.75rem]"
    >
      {HEADLINE.split(" ").map((word, i) => {
        if (word === "your") {
          return (
            <span key={i} className="accent-word mr-[0.25em] italic">
              <span className="accent-placeholder" aria-hidden="true">
                {word}
              </span>
              <span className="accent-fill">{word}</span>
            </span>
          );
        }
        return (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="mr-[0.25em] inline-block"
          >
            {word}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}

function Subhead({ armed }: { armed: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 18 }}
      animate={armed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 max-w-[560px] text-[17px] leading-[1.65] text-muted-foreground"
    >
      We build custom AI automations for whatever eats your team's time.
      Chasing leads, moving data, processing paperwork, scheduling, reporting,
      and anything else you can describe. We design it, build it, and run it
      for you.
    </motion.p>
  );
}

function Ctas({ armed }: { armed: boolean }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={armed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <BookCallButton variant="solid" className="px-6 py-3.5">
          Book a call
        </BookCallButton>
        <a
          href="#what-we-build"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          See what we build <ArrowRight size={16} />
        </a>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={armed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="mt-5 font-mono-label text-[11px] text-muted-foreground/80"
      >
        Built for you, owned by you, running in{" "}
        <span className="font-semibold text-primary">weeks</span> not quarters.
      </motion.p>
    </>
  );
}

export default function Hero() {
  const [armed, setArmed] = useState(false);
  const reduced = !!useReducedMotion();

  // Exit parallax: the copy lifts a little faster than the page and the
  // window a little slower, so the hero has depth as it scrolls off. No
  // fades: by the time the stage's first line is up the hero is off-screen
  // anyway, and a hero that simply scrolls away reads as a normal page.
  // scrollY (not progress) keeps this on Framer's JS path, like MeshField.
  const { scrollY } = useScroll();
  const k = reduced ? 0 : 1;
  const yCopy = useTransform(scrollY, [0, 560], [0, -120 * k]);
  const yMac = useTransform(scrollY, [0, 560], [0, -50 * k]);

  useEffect(() => {
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setArmed(true);
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(arm));
    });
    const fallback = window.setTimeout(arm, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section
      id="top"
      className={`relative pt-28 pb-16 sm:pt-32 lg:pb-24${armed ? " hero-ready" : ""}`}
    >
      <div className="relative mx-auto min-w-0 w-full max-w-[1600px] px-5 sm:px-8">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 xl:grid-cols-[minmax(22rem,32rem)_minmax(0,1fr)] xl:gap-10">
        <motion.div style={{ y: yCopy, willChange: "transform" }}>
          <Headline armed={armed} />
          <Subhead armed={armed} />
          <Ctas armed={armed} />
        </motion.div>
        <motion.div
          className="relative min-w-0 w-full"
          // Promoted so the lift is a compositor move, not a re-raster of the
          // whole dashboard at 2x on every scroll frame.
          style={{ y: yMac, willChange: "transform" }}
        >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={armed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.98 }}
          transition={{
            duration: 0.8,
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative min-w-0 w-full"
        >
          <div
            aria-hidden
            className="absolute inset-x-0 -top-16 -bottom-16 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,hsl(222_84%_53%/0.16),hsl(222_84%_53%/0.05)_60%,transparent)]"
          />
          <HeroDemo ready={armed} reduced={reduced} />
        </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
