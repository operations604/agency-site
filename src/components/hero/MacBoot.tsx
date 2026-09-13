import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import CompanyDashboard from "../dashboard/CompanyDashboard";

const STAGES = [
  { at: 0, label: "Connecting workspace" },
  { at: 480, label: "Loading modules" },
  { at: 960, label: "Preparing dashboard" },
  { at: 1400, label: "Ready" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function BrandMark() {
  return <img src="/favicon.svg?v=4" alt="" className="h-7 w-7 shrink-0" />;
}

function BrandRow() {
  return (
    <>
      <BrandMark />
      <span className="text-[16px] font-semibold tracking-tight text-foreground">
        Applied Systems
      </span>
    </>
  );
}

export default function MacBoot({ ready }: { ready: boolean }) {
  const reduced = !!useReducedMotion();
  const [play, setPlay] = useState(reduced);
  const [stage, setStage] = useState(reduced ? STAGES.length - 1 : 0);
  const [app, setApp] = useState(reduced);
  const [spinning, setSpinning] = useState(!reduced);
  const spinnerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (reduced || !ready || play) return;
    // Start with the window's entrance (hero card delay is 0.4s).
    const t = window.setTimeout(() => setPlay(true), 220);
    return () => window.clearTimeout(t);
  }, [ready, reduced, play]);

  useEffect(() => {
    if (!play || reduced) return;
    const timers = STAGES.slice(1).map((s, i) =>
      window.setTimeout(() => setStage(i + 1), s.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [play, reduced]);

  useEffect(() => {
    if (reduced) {
      setSpinning(false);
      setApp(true);
      return;
    }
    if (!play || stage !== STAGES.length - 1) return;
    const halt = window.setTimeout(() => {
      const el = spinnerRef.current;
      if (el) el.style.transform = getComputedStyle(el).transform;
      setSpinning(false);
    }, 380);
    const go = window.setTimeout(() => setApp(true), 500);
    return () => {
      window.clearTimeout(halt);
      window.clearTimeout(go);
    };
  }, [play, stage, reduced]);

  return (
    <div
      className={`hairline soft-shadow-lg flex aspect-[16/10] min-h-[240px] flex-col overflow-hidden rounded-2xl bg-white${play ? " boot-play" : ""}`}
    >
      <div className="flex h-7 shrink-0 items-center border-b border-[hsl(38_21%_90%)] bg-[hsl(220_24%_96%)] px-3">
        <div className="flex items-center gap-[6px]" aria-hidden>
          <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-[11px] font-medium text-[hsl(222_10%_40%)]">
          Applied Systems
        </span>
        <span className="w-9" aria-hidden />
      </div>

      {/*
        No content-visibility here: it re-ran layout for the whole dashboard
        every time the hero crossed the viewport edge, right at the seam with
        the stage. Hero.tsx hides the Mac (visibility) once it has faded
        instead, which skips paint without any layout work.
      */}
      <div className="relative min-h-0 flex-1">
        {app && (
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-0"
          >
            <CompanyDashboard reduced={reduced} />
          </motion.div>
        )}
        <AnimatePresence>
          {!app && (
            <motion.div
              key="boot"
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white px-8"
            >
              <div className="boot-wipe">
                <div className="boot-wipe-hold" aria-hidden>
                  <BrandRow />
                </div>
                <div className="boot-wipe-fill">
                  <BrandRow />
                </div>
              </div>

              <svg
                ref={spinnerRef}
                viewBox="0 0 24 24"
                className={`mt-6 h-5 w-5${spinning ? " boot-spin" : ""}`}
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="hsl(220 16% 88%)"
                  strokeWidth="2.25"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="hsl(222 10% 42%)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeDasharray="12 45"
                />
              </svg>

              <div className="relative mt-3 h-5 w-full max-w-[240px] overflow-hidden text-center">
                <AnimatePresence>
                  <motion.p
                    key={play ? STAGES[stage].label : "wait"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: play ? 1 : 0, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="absolute inset-x-0 font-mono-label text-[11px] text-[hsl(222_10%_45%)]"
                  >
                    {STAGES[stage].label}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
