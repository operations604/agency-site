import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import BookCallButton from "../components/ui/BookCallButton";
import HeroDemo from "../components/hero/HeroDemo";
import MeshField from "../components/hero/MeshField";
import ScaleFrame from "./ScaleFrame";

const HEADLINE = "Custom software and automation, built around your business.";
const EASE = [0.22, 1, 0.36, 1] as const;

const DASH_W = 760;
const DASH_H = Math.round(DASH_W * 0.625) + 88;

export default function MobileHero() {
  const [armed, setArmed] = useState(false);
  const reduced = !!useReducedMotion();
  const { scrollY } = useScroll();
  const k = reduced ? 0 : 1;
  const yCopy = useTransform(scrollY, [0, 420], [0, -36 * k]);
  const yMac = useTransform(scrollY, [0, 420], [0, -14 * k]);

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
      className={`relative overflow-x-clip pt-[5.5rem] pb-8${armed ? " hero-ready" : ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -bottom-[20vh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      >
        <MeshField extend />
      </div>

      <div className="relative mx-auto w-full max-w-[840px] px-5">
        <motion.div style={{ y: yCopy, willChange: "transform" }} className="w-full">
          <motion.h1
            initial="hidden"
            animate={armed ? "visible" : "hidden"}
            variants={{
              visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
            }}
            className="text-center text-[clamp(2.15rem,6.4vw,3.35rem)] leading-[1.08] tracking-[-0.03em] sm:text-left"
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
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.55, ease: EASE },
                    },
                  }}
                  className="mr-[0.25em] inline-block"
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.h1>

          <div className="mt-6 flex flex-col items-center gap-6 sm:mt-7 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={armed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.55, delay: 0.45, ease: EASE }}
              className="min-w-0 max-w-[42ch] text-center sm:text-left"
            >
              <p className="text-[17px] leading-[1.6] text-muted-foreground sm:text-[18px]">
                We build custom AI automations for whatever eats your team's time.
                Chasing leads, moving data, processing paperwork, scheduling,
                reporting, and anything else you can describe. We design it, build
                it, and run it for you.
              </p>
              <p className="mt-4 font-mono-label text-[11px] text-muted-foreground/80">
                Built for you, owned by you, running in{" "}
                <span className="font-semibold text-primary">weeks</span> not
                quarters.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={armed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.55, delay: 0.6, ease: EASE }}
              className="flex w-full shrink-0 flex-row flex-wrap items-center justify-center gap-3 sm:w-auto sm:flex-col sm:items-stretch"
            >
              <BookCallButton variant="solid" className="px-6 py-3.5 whitespace-nowrap">
                Book a call
              </BookCallButton>
              <a
                href="#what-we-build"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-[15px] font-medium whitespace-nowrap text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                See what we build <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="relative mt-10 flex w-full justify-center"
        style={{ y: yMac, willChange: "transform" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={
            armed
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 24, scale: 0.97 }
          }
          transition={{ duration: 0.75, delay: 0.35, ease: EASE }}
          className="relative w-full max-w-[100vw] overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-x-[-8%] -top-10 -bottom-8 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,hsl(222_84%_53%/0.18),hsl(222_84%_53%/0.05)_62%,transparent)]"
          />
          <ScaleFrame width={DASH_W} height={DASH_H} className="mx-auto w-full">
            <HeroDemo ready={armed} reduced={reduced} />
          </ScaleFrame>
        </motion.div>
      </motion.div>
    </section>
  );
}
