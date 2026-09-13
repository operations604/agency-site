import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  FileText,
  Sparkles,
  UserRound,
  MessageSquare,
  Check,
} from "lucide-react";

const NODES = [
  { x: 80, label: "New lead", sub: "web form", icon: FileText, status: "received" },
  { x: 240, label: "Enrich & score", sub: "data + score", icon: Sparkles, status: "scored 92" },
  { x: 400, label: "Route to rep", sub: "assign owner", icon: UserRound, status: "routed" },
  { x: 560, label: "Text sent", sub: "auto reply", icon: MessageSquare, status: "sent in 45s" },
];

const CENTER_Y = 118;
const NODE_W = 140;
const NODE_H = 96;

// Status of the newest run tracks the flow animation; the rest are history.
const LIVE_STATUS = ["Received", "Scored 92", "Routed · Jordan", "Text sent · 45s"];
const RUNS = [
  { name: "Maya Thompson", source: "Web form", when: "just now" },
  { name: "Carlos Reyes", source: "Google Ads", when: "2m ago", status: "Text sent · 38s" },
  { name: "Dana Whitfield", source: "Phone", when: "9m ago", status: "Booked · Fri 10am" },
];
const SOURCES = ["Web form", "Google Ads", "Phone", "Referral"];

export default function LeadPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(3);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    if (step < 3) {
      timer = setTimeout(() => setStep((s) => s + 1), 1700);
    } else {
      timer = setTimeout(() => setStep(0), 2800);
    }
    return () => clearTimeout(timer);
  }, [step, inView, reduced]);

  return (
    <div ref={ref} className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[hsl(38_21%_90%)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="dash-live-dot h-1.5 w-1.5 rounded-full bg-[hsl(147_66%_39%)]" />
          <span className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Inbound lead flow</span>
          <span className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">v14 · live</span>
        </div>
        <div className="flex gap-1.5">
          {SOURCES.map((s, i) => (
            <span
              key={s}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                i === 0
                  ? "bg-[hsl(223_14%_10%)] text-white"
                  : "border border-[hsl(38_21%_90%)] text-[hsl(222_10%_45%)]"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="dot-grid relative w-full" style={{ aspectRatio: "640 / 236" }}>
      <svg
        viewBox="0 0 640 236"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {NODES.slice(0, 3).map((node, i) => {
          const startX = node.x + NODE_W / 2;
          const endX = NODES[i + 1].x - NODE_W / 2;
          const midX = (startX + endX) / 2;
          const d = `M${startX},${CENTER_Y} C${midX},${CENTER_Y - 14} ${midX},${CENTER_Y + 14} ${endX},${CENTER_Y}`;
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="hsl(180 80% 27%)"
              strokeWidth={1.5}
              strokeDasharray="5 6"
              animate={{ strokeDashoffset: [0, -22] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              opacity={0.55}
            />
          );
        })}
        <motion.circle
          r={6}
          fill="hsl(180 80% 27%)"
          animate={{ cx: NODES[step].x, cy: CENTER_Y }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          r={6}
          fill="hsl(180 80% 27%)"
          opacity={0.35}
          animate={{ cx: NODES[step].x, cy: CENTER_Y, scale: [1, 2.2, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
        />
        {/* Node content is native SVG (not foreignObject): Safari does not
            scale HTML inside a scaled SVG, which made labels overflow. */}
        {NODES.map((node, i) => {
          const done = step >= i;
          const active = step === i;
          const Icon = node.icon;
          const left = node.x - NODE_W / 2;
          const top = CENTER_Y - NODE_H / 2;
          const chipWidth = 26 + node.status.length * 5.9;
          return (
            <g key={i}>
              <motion.rect
                x={left}
                y={top}
                width={NODE_W}
                height={NODE_H}
                rx={14}
                fill="white"
                animate={{
                  stroke: active ? "hsl(21 89% 54%)" : "hsl(38 21% 90%)",
                  strokeWidth: active ? 2 : 1,
                }}
                transition={{ duration: 0.4 }}
                filter="drop-shadow(0 6px 14px hsl(223 14% 10% / 0.06))"
              />
              <g
                style={{
                  color: active ? "hsl(21 89% 54%)" : "hsl(222 10% 40%)",
                }}
              >
                <Icon size={15} strokeWidth={2} x={left + 12} y={top + 12} />
              </g>
              <text
                x={left + 33}
                y={top + 24}
                fontSize={12}
                fontWeight={600}
                fill="hsl(223 14% 10%)"
                style={{ fontFamily: "var(--font-body-stack)" }}
              >
                {node.label}
              </text>
              <text
                x={left + 12}
                y={top + 46}
                fontSize={10.5}
                letterSpacing="0.05em"
                fill="hsl(222 10% 55%)"
                style={{ fontFamily: "var(--font-mono-stack)" }}
              >
                {node.sub.toUpperCase()}
              </text>
              {done ? (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <rect
                    x={left + 12}
                    y={top + 60}
                    width={chipWidth}
                    height={18}
                    rx={9}
                    fill="hsl(147 66% 39% / 0.12)"
                  />
                  <g style={{ color: "hsl(147 66% 34%)" }}>
                    <Check
                      size={10}
                      strokeWidth={3}
                      x={left + 18}
                      y={top + 64}
                    />
                  </g>
                  <text
                    x={left + 32}
                    y={top + 72.5}
                    fontSize={9.5}
                    letterSpacing="0.05em"
                    fill="hsl(147 66% 30%)"
                    style={{ fontFamily: "var(--font-mono-stack)" }}
                  >
                    {node.status.toUpperCase()}
                  </text>
                </motion.g>
              ) : (
                <text
                  x={left + 12}
                  y={top + 72.5}
                  fontSize={9.5}
                  letterSpacing="0.05em"
                  fill="hsl(222 10% 60%)"
                  style={{ fontFamily: "var(--font-mono-stack)" }}
                >
                  WAITING
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {/* Run log */}
      <div className="border-t border-[hsl(38_21%_90%)] px-4 pb-3 pt-2.5">
        <div className="mb-1.5 flex items-center justify-between font-mono-label text-[9px] text-[hsl(222_10%_55%)]">
          <span>Recent runs</span>
          <span>Avg first reply 41s</span>
        </div>
        <div className="divide-y divide-[hsl(38_21%_92%)]">
          {RUNS.map((run, i) => {
            const live = i === 0;
            const label = (live ? LIVE_STATUS[step] : run.status) ?? "";
            const doneLike = !live || step === 3;
            return (
              <div key={run.name} className="flex items-center gap-3 py-1.5 text-[11px]">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    live && step < 3 ? "dash-live-dot bg-[hsl(21_89%_54%)]" : "bg-[hsl(147_66%_39%)]"
                  }`}
                />
                <span className="w-[112px] truncate font-medium text-[hsl(223_14%_10%)]">{run.name}</span>
                <span className="w-[74px] text-[hsl(222_10%_50%)]">{run.source}</span>
                <span
                  className={`flex-1 truncate font-mono-label text-[9px] ${
                    doneLike ? "text-[hsl(147_66%_30%)]" : "text-[hsl(21_89%_45%)]"
                  }`}
                >
                  {label.toUpperCase()}
                </span>
                <span className="font-mono-label text-[9px] text-[hsl(222_10%_60%)]">{run.when}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
