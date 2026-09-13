import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// One set of values per tab: [This month, This quarter, All time]
const STATS = [
  { label: "Hours saved / mo", values: [312, 941, 5230], suffix: "" },
  { label: "Leads < 5 min", values: [94, 95, 93], suffix: "%" },
  { label: "Jobs scheduled", values: [128, 389, 2140], suffix: "" },
  { label: "Invoices processed", values: [476, 1408, 7815], suffix: "" },
];

const TABS = ["This month", "This quarter", "All time"];

function CountUp({
  target,
  active,
  reduced,
}: {
  target: number;
  active: boolean;
  reduced: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (reduced) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, reduced]);

  return <span>{value.toLocaleString()}</span>;
}

export default function OpsDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const reduced = !!useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const interval = setInterval(() => setCycle((c) => c + 1), 7000);
    return () => clearInterval(interval);
  }, [inView, reduced]);

  return (
    <div ref={ref} className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="dash-live-dot h-1.5 w-1.5 rounded-full bg-[hsl(147_66%_39%)]" />
          <span className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Operations</span>
          <span className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">6 automations running</span>
        </div>
        <span className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">Updated just now</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab === i
                ? "bg-[hsl(223_14%_10%)] text-white"
                : "border border-[hsl(38_21%_90%)] text-[hsl(222_10%_45%)] hover:border-foreground/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[hsl(38_21%_90%)] bg-white p-3.5"
          >
            <div className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">
              {stat.label}
            </div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight text-[hsl(223_14%_10%)]">
              <CountUp
                key={`${tab}-${cycle}`}
                target={stat.values[tab]}
                active={inView}
                reduced={reduced}
              />
              {stat.suffix}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-[hsl(38_21%_90%)] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">
            Automation output
          </span>
          <span className="font-mono-label text-[9px] text-[hsl(180_80%_27%)]">
            +38%
          </span>
        </div>
        <svg
          viewBox="0 0 320 110"
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: 92 }}
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(180 80% 27% / 0.22)" />
              <stop offset="100%" stopColor="hsl(180 80% 27% / 0)" />
            </linearGradient>
          </defs>
          {[22, 44, 66, 88].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="320"
              y2={y}
              stroke="hsl(38 21% 90%)"
              strokeWidth="0.5"
            />
          ))}
          <motion.path
            d="M0,88 C40,80 60,40 100,52 C140,64 160,20 200,28 C240,36 270,12 320,18 L320,110 L0,110 Z"
            fill="url(#areaFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          <motion.path
            d="M0,88 C40,80 60,40 100,52 C140,64 160,20 200,28 C240,36 270,12 320,18"
            fill="none"
            stroke="hsl(180 80% 27%)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
          />
        </svg>
        <div className="mt-3 flex h-12 items-end justify-between gap-2">
          {[40, 65, 50, 80, 60, 95].map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-md bg-[hsl(21_89%_54%/0.85)]"
              initial={{ height: 0 }}
              animate={{ height: inView ? `${height}%` : 0 }}
              transition={{
                duration: 0.6,
                delay: 0.5 + i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
