import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { stageScroll } from "../lib/stage-scroll";
import PreviewCard from "../components/ui/PreviewCard";
import { CalendarCard, SATELLITE_CARDS, SmsCard } from "../components/previews/Satellites";
import LeadPipeline from "../components/previews/LeadPipeline";
import InvoiceExtraction from "../components/previews/InvoiceExtraction";
import OpsDashboard from "../components/previews/OpsDashboard";
import AgentInbox from "../components/previews/AgentInbox";

const GPU = { willChange: "transform, opacity" } as const;

const STAGE_VH = 460;
const OVERLAP_VH = 24;
const BEAT = 0.12;
const BEATS = [0.24, 0.36, 0.48, 0.6];
const FINAL = BEATS[3] + BEAT;
const PRELOAD = 0.03;
const WAIT = 1 / 255;
const FLY = 0.055;
const RISE = 0.05;
const EXIT = 0.03;
const PARK_SCALE = 0.58;
const STAGE_CENTER = { x: 50, y: 63 };

type Item = {
  tag: string;
  host: string;
  title: string;
  copy: string;
  accent: string;
  size?: number;
  Preview: ComponentType;
};

const ITEMS: Item[] = [
  {
    tag: "Lead routing",
    host: "leads.yourcompany.com",
    title: "Every lead answered in under a minute.",
    copy: "A new inquiry hits your form. We enrich it, score it, route it to the right rep, and send the first text before anyone opens a tab.",
    accent: "21 89% 54%",
    Preview: LeadPipeline,
  },
  {
    tag: "Document processing",
    host: "docs.yourcompany.com",
    title: "Paperwork that files itself.",
    copy: "Invoices and contracts come in by email. We read them, pull the fields that matter, and post them where they belong.",
    accent: "38 92% 50%",
    Preview: InvoiceExtraction,
  },
  {
    tag: "Operations dashboard",
    host: "ops.yourcompany.com",
    title: "The numbers you ask for, already there.",
    copy: "A live view of what your automations are doing. Hours saved, leads answered, jobs scheduled. No Monday morning export.",
    accent: "174 62% 40%",
    size: 0.92,
    Preview: OpsDashboard,
  },
  {
    tag: "Agent inbox",
    host: "inbox.yourcompany.com",
    title: "An inbox that replies and books for you.",
    copy: "Customer messages get a real, on-brand reply in seconds. When a time is agreed, the booking lands on the calendar.",
    accent: "222 84% 53%",
    Preview: AgentInbox,
  },
];

const ORIGINS = [
  { x: "-110vw", y: "-24vh", r: -7, ry: 34, rx: 6 },
  { x: "110vw", y: "-30vh", r: 6, ry: -34, rx: 6 },
  { x: "-90vw", y: "60vh", r: 8, ry: 28, rx: -18 },
  { x: "90vw", y: "55vh", r: -8, ry: -28, rx: -18 },
];
const PARK = [
  { x: "-36vw", y: "-28vh", r: -3 },
  { x: "36vw", y: "-28vh", r: 3 },
  { x: "-36vw", y: "18vh", r: 2 },
  { x: "36vw", y: "18vh", r: -2 },
];
const FINAL_SLOTS = [
  { x: "-28vw", y: "-46vh", r: -4, s: 0.52, drift: -2, z: 12 },
  { x: "28vw", y: "-44vh", r: 4, s: 0.52, drift: -2, z: 12 },
  { x: "-36vw", y: "-54vh", r: -8, s: 0.34, drift: -1, z: 9 },
  { x: "36vw", y: "-52vh", r: 8, s: 0.34, drift: -1, z: 9 },
];

const SATELLITES = [
  { id: "slack", x: "0vw", y: "-50vh", r: 2, w: "min(86vw, 360px)", d: 0, drift: -2, from: { x: "0vw", y: "-90vh" } },
  { id: "calendar", x: "0vw", y: "16vh", r: -2, w: "min(88vw, 340px)", d: 0.006, drift: -2, from: { x: "0vw", y: "90vh" } },
  { id: "quickbooks", x: "-20vw", y: "-34vh", r: 4, w: "min(72vw, 290px)", d: 0.012, drift: -2, from: { x: "-90vw", y: "-34vh" } },
  { id: "docusign", x: "20vw", y: "-32vh", r: -4, w: "min(72vw, 290px)", d: 0.018, drift: -2, from: { x: "90vw", y: "-32vh" } },
  { id: "sheets", x: "-16vw", y: "-8vh", r: 2, w: "min(82vw, 320px)", d: 0.024, drift: -2, from: { x: "-90vw", y: "-8vh" } },
  { id: "sms", x: "18vw", y: "-10vh", r: -2, w: "min(80vw, 320px)", d: 0.03, drift: -2, from: { x: "90vw", y: "-10vh" } },
] as const;

const CHIPS = [
  { slug: "gmail", label: "Gmail", left: "18%", top: "14%", beat: 0, d: 0 },
  { slug: "hubspot", label: "HubSpot", left: "82%", top: "14%", beat: 0, d: 0.012 },
  { slug: "twilio", label: "Twilio", left: "50%", top: "92%", beat: 0, d: 0.024 },
  { slug: "quickbooks", label: "QuickBooks", left: "8%", top: "50%", beat: 1, d: 0 },
  { slug: "google-drive", label: "Drive", left: "92%", top: "50%", beat: 1, d: 0.012 },
  { slug: "slack", label: "Slack", left: "84%", top: "88%", beat: 2, d: 0.012 },
  { slug: "google-calendar", label: "Calendar", left: "68%", top: "92%", beat: 3, d: 0 },
  { slug: "intercom", label: "Intercom", left: "32%", top: "92%", beat: 3, d: 0.012 },
];

const MESH = [
  { color: "245 100% 68%", size: 420, left: "-12%", top: "-10%", drift: -100 },
  { color: "217 91% 56%", size: 380, left: "48%", top: "-6%", drift: -160 },
  { color: "191 90% 52%", size: 320, left: "18%", top: "58%", drift: -80 },
];

type P = MotionValue<number>;
const c = (n: number) => Math.min(1, Math.max(0, n));

export default function MobileHandoff() {
  const reduced = !!useReducedMotion();
  if (reduced) return <Stacked />;
  return <Stage />;
}

function Stage() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: raw } = useScroll({
    target: ref,
    offset: ["start 100%", "end 100%"],
  });
  useMotionValueEvent(raw, "change", (v) => stageScroll.set(v));
  useLayoutEffect(() => {
    stageScroll.set(raw.get());
  }, [raw]);
  const p = useSpring(raw, { stiffness: 620, damping: 58, mass: 0.4, restDelta: 0.0002 });

  const [fit, setFit] = useState(1);
  useEffect(() => {
    const sync = () => setFit(Math.min(1, (window.innerHeight * 0.52) / 540));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const topScrim = useTransform(
    p,
    [BEATS[0] - 0.02, BEATS[0] + 0.04, FINAL, FINAL + 0.05],
    [WAIT, 1, 1, WAIT],
  );
  const centerScrim = useTransform(p, [FINAL, FINAL + 0.06], [WAIT, 1]);
  const liftY = useTransform(p, [0.97, 1], [0, -40]);
  const liftOp = useTransform(p, [0.975, 1], [1, 0.75]);

  return (
    <section
      ref={ref}
      id="what-we-build"
      className="pointer-events-none relative"
      style={{ height: `${STAGE_VH}vh`, marginTop: `-${OVERLAP_VH}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <StageMesh p={raw} />
        <motion.div className="absolute inset-0" style={{ y: liftY, opacity: liftOp, ...GPU }}>
          {ITEMS.map((item, i) => (
            <Spot key={item.tag} p={p} i={i} color={item.accent} />
          ))}
          <Wires p={p} />
          {CHIPS.map((chip) => (
            <Chip key={chip.slug} p={p} chip={chip} />
          ))}
          {SATELLITES.map((s, i) => (
            <Satellite key={s.id} p={p} sat={s} i={i} />
          ))}
          {ITEMS.map((item, i) => (
            <Window key={item.tag} p={p} i={i} item={item} fit={fit} />
          ))}

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[40%]"
            style={{
              opacity: topScrim,
              ...GPU,
              background:
                "radial-gradient(ellipse 70% 50% at 50% 48%, hsl(220 40% 99%) 40%, hsl(220 40% 99% / 0.82) 60%, transparent 100%)",
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[28%] z-20 h-[38%]"
            style={{
              opacity: centerScrim,
              ...GPU,
              background:
                "radial-gradient(ellipse 70% 58% at 50% 46%, hsl(220 40% 99%) 46%, hsl(220 40% 99% / 0.86) 64%, transparent 100%)",
            }}
          />

          <Beat
            p={raw}
            center
            title="Tell us what eats your team's week."
            enter={[0.13, 0.2]}
            exit={[BEATS[0] - EXIT, BEATS[0]]}
          />
          {ITEMS.map((item, i) => {
            const b0 = BEATS[i];
            const b1 = i < BEATS.length - 1 ? BEATS[i + 1] : FINAL;
            return (
              <Beat
                key={item.tag}
                p={p}
                tag={item.tag}
                title={item.title}
                copy={item.copy}
                enter={[b0 + 0.01, b0 + 0.01 + RISE]}
                exit={[b1 - EXIT, b1]}
              />
            );
          })}
          <Beat
            p={p}
            center
            mark
            title="This is what we hand you."
            copy="Real interfaces, built for your process. Not another tool to log into."
            enter={[FINAL + 0.015, FINAL + 0.015 + RISE]}
          />
          <Rail p={raw} />
        </motion.div>
      </div>
    </section>
  );
}

function Window({
  p,
  i,
  item,
  fit,
}: {
  p: P;
  i: number;
  item: Item;
  fit: number;
}) {
  const o = ORIGINS[i];
  const pk = PARK[i];
  const f = FINAL_SLOTS[i];
  const k = (item.size ?? 1) * fit;
  const b0 = BEATS[i];
  const b1 = BEATS[i + 1] as number | undefined;
  const t0 = b0 - PRELOAD;
  const t1 = b0 - 0.012;
  const w0 = i > 0 ? BEATS[i - 1] + FLY + 0.02 : 0;
  const times =
    b1 !== undefined
      ? [t1, b0, b0 + FLY, b1, b1 + FLY, FINAL, FINAL + FLY, 1]
      : [t1, b0, b0 + FLY, FINAL, FINAL + FLY, 1];
  const seq = <T,>(origin: T, centre: T, park: T, final: T, end: T = final): T[] =>
    b1 !== undefined
      ? [centre, origin, centre, centre, park, park, final, end]
      : [centre, origin, centre, centre, final, end];

  const x = useTransform(p, times, seq(o.x, "0vw", pk.x, f.x));
  const y = useTransform(
    p,
    times,
    seq(o.y, "0vh", pk.y, f.y, `${parseFloat(f.y) + f.drift}vh`),
  );
  const rotate = useTransform(p, times, seq(o.r, 0, pk.r, f.r));
  const rotateY = useTransform(p, times, seq(o.ry, 0, 0, 0));
  const rotateX = useTransform(p, times, seq(o.rx, 0, 0, 0));
  const scale = useTransform(p, times, seq(0.92 * k, k, PARK_SCALE * k, f.s * k));
  const lead = i > 0 ? [w0, w0 + 0.002] : [0];
  const leadV = i > 0 ? [0, WAIT] : [WAIT];
  const opacity = useTransform(
    p,
    b1 !== undefined
      ? [...lead, t0, t1, b0, b0 + FLY * 0.45, b1, b1 + FLY, FINAL, FINAL + FLY, 1]
      : [...lead, t0, t1, b0, b0 + FLY * 0.45, FINAL, FINAL + FLY, 1],
    b1 !== undefined
      ? [...leadV, WAIT, 0, 0, 1, 1, 0.8, 0.8, 1, 1]
      : [...leadV, WAIT, 0, 0, 1, 1, 1, 1],
  );
  const Preview = item.Preview;

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2"
      style={{ width: "min(96vw, 560px)", zIndex: f.z }}
    >
      <motion.div
        style={{
          x,
          y,
          rotate,
          rotateX,
          rotateY,
          scale,
          opacity,
          transformPerspective: 1400,
          ...GPU,
        }}
      >
        <div className="stage-float" style={{ animationDelay: `${-i * 1.7}s` }}>
          <PreviewCard className="max-h-[64dvh]">
            <div className="relative flex items-center border-b border-border bg-[hsl(220_24%_96%)] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="absolute left-1/2 flex w-[52%] -translate-x-1/2 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 py-1">
                <img src="/favicon.svg?v=4" alt="" className="h-3 w-3" />
                <span className="truncate text-[12px] font-medium text-muted-foreground">
                  {item.host}
                </span>
              </div>
            </div>
            <Preview />
          </PreviewCard>
        </div>
      </motion.div>
    </div>
  );
}

function Satellite({ p, sat, i }: { p: P; sat: (typeof SATELLITES)[number]; i: number }) {
  const at = FINAL + 0.01 + sat.d;
  const t0 = at - PRELOAD;
  const t1 = at - 0.012;
  const end = `${parseFloat(sat.y) + sat.drift}vh`;
  const x = useTransform(p, [t1, at, at + FLY], [sat.x, sat.from.x, sat.x]);
  const y = useTransform(p, [t1, at, at + FLY, 1], [sat.y, sat.from.y, sat.y, end]);
  const rotate = useTransform(p, [t1, at, at + FLY], [sat.r, sat.r * 3, sat.r]);
  const scale = useTransform(p, [t1, at, at + FLY], [1, 0.9, 1]);
  const opacity = useTransform(p, [t0, t1, at, at + FLY * 0.5], [WAIT, 0, 0, 1]);
  const Card = SATELLITE_CARDS[sat.id];
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      style={{
        width: sat.w,
        zIndex: sat.id === "calendar" ? 20 : sat.id === "sms" ? 19 : sat.id === "sheets" ? 18 : 15,
      }}
    >
      <motion.div style={{ x, y, rotate, scale, opacity, ...GPU }}>
        <div className="stage-float overflow-visible" style={{ animationDelay: `${-i * 1.1 - 0.6}s` }}>
          {sat.id === "calendar" ? (
            <CalendarCard compact />
          ) : sat.id === "sms" ? (
            <SmsCard compact />
          ) : (
            <Card />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Spot({ p, i, color }: { p: P; i: number; color: string }) {
  const b0 = BEATS[i];
  const b1 = i < BEATS.length - 1 ? BEATS[i + 1] : FINAL;
  const opacity = useTransform(p, [b0, b0 + FLY, b1 - EXIT, b1 + 0.02], [WAIT, 1, 1, WAIT]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-[6] h-[50vh] w-[80vw] -translate-x-1/2 -translate-y-1/2"
      style={{
        top: `${STAGE_CENTER.y}%`,
        opacity,
        willChange: "opacity",
        background: `radial-gradient(ellipse 70% 70% at 50% 50%, hsl(${color} / 0.22), hsl(${color} / 0.08) 45%, transparent 72%)`,
      }}
    />
  );
}

function Beat({
  p,
  title,
  tag,
  copy,
  enter,
  exit,
  center,
  mark,
}: {
  p: P;
  title: string;
  tag?: string;
  copy?: string;
  enter: [number, number];
  exit?: [number, number];
  center?: boolean;
  mark?: boolean;
}) {
  const words = title.split(" ");
  const step = (enter[1] - enter[0]) / (words.length + 2);
  const ex = exit ?? [0.99, 1];
  const exitTo = exit ? 1 : 0;
  const opacity = useTransform(p, [ex[0], ex[1]], [1, 1 - exitTo]);
  const y = useTransform(p, [ex[0], ex[1]], [0, -24 * exitTo]);
  const tagOp = useTransform(p, [enter[0] - 0.01, enter[0] + 0.02], [0, 1]);
  const tagY = useTransform(p, [enter[0] - 0.01, enter[0] + 0.02], [10, 0]);
  const copyIn = [c(enter[1] - step * 2), c(enter[1] + 0.02)];
  const copyOp = useTransform(p, copyIn, [0, 1]);
  const copyY = useTransform(p, copyIn, [14, 0]);
  const markOp = useTransform(p, [enter[0] - 0.015, enter[0] + 0.02], [0, 1]);
  const markSc = useTransform(p, [enter[0] - 0.015, enter[0] + 0.02], [0.6, 1]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-5 ${
        mark ? "top-[12%]" : center ? "inset-y-0 items-center" : "top-[16%]"
      }`}
    >
      <motion.div
        className="flex max-w-[34rem] flex-col items-center text-center"
        style={{ opacity, y, ...GPU }}
      >
        {mark && (
          <motion.img
            src="/favicon.svg?v=6"
            alt=""
            className="mb-5 h-12 w-12"
            style={{ opacity: markOp, scale: markSc, ...GPU }}
          />
        )}
        {tag && (
          <motion.span
            className="mb-3 font-mono-label text-[11px] text-primary"
            style={{ opacity: tagOp, y: tagY, ...GPU }}
          >
            {tag}
          </motion.span>
        )}
        <h2
          className={`text-balance ${
            center ? "text-[clamp(1.85rem,6vh,2.75rem)]" : "text-[clamp(1.45rem,4.2vh,2.1rem)]"
          }`}
        >
          {words.map((w, k) => (
            <Word
              key={k}
              p={p}
              word={w}
              t0={c(enter[0] + k * step)}
              t1={c(enter[0] + k * step + step * 2.6)}
            />
          ))}
        </h2>
        {copy && (
          <motion.p
            className="relative mt-3 max-w-[32rem] text-[15px] leading-[1.55] text-muted-foreground"
            style={{ opacity: copyOp, y: copyY, ...GPU }}
          >
            {mark && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[180%] w-[122%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(220_40%_98%/0.62)] backdrop-blur-[8px]"
              />
            )}
            {copy}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function Word({ p, word, t0, t1 }: { p: P; word: string; t0: number; t1: number }) {
  const y = useTransform(p, [t0, t1], [18, 0]);
  const opacity = useTransform(p, [t0, t1], [0, 1]);
  return (
    <motion.span className="mr-[0.25em] inline-block" style={{ y, opacity, ...GPU }}>
      {word}
    </motion.span>
  );
}

function Chip({ p, chip }: { p: P; chip: (typeof CHIPS)[number] }) {
  const at = BEATS[chip.beat] + 0.02 + chip.d;
  const opacity = useTransform(p, [at, at + 0.035, FINAL, FINAL + FLY * 0.6], [0, 1, 1, 0]);
  const scale = useTransform(p, [at, at + 0.045, FINAL, FINAL + FLY], [0.7, 1, 1, 0.8]);
  const y = useTransform(p, [at, at + 0.045], [14, 0]);
  return (
    <div
      className="pointer-events-none absolute z-[8] -translate-x-1/2 -translate-y-1/2"
      style={{ left: chip.left, top: chip.top }}
    >
      <motion.div
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 soft-shadow"
        style={{ opacity, scale, y, ...GPU }}
      >
        <img
          src={`/logos/${chip.slug}.png`}
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] object-contain"
        />
        <span className="text-[12px] font-medium text-foreground">{chip.label}</span>
      </motion.div>
    </div>
  );
}

function Wires({ p }: { p: P }) {
  const opacity = useTransform(p, [FINAL, FINAL + FLY * 0.6], [1, 0]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ opacity, willChange: "opacity" }}
    >
      {CHIPS.map((chip) => (
        <Wire key={chip.slug} p={p} chip={chip} />
      ))}
    </motion.div>
  );
}

function Wire({ p, chip }: { p: P; chip: (typeof CHIPS)[number] }) {
  const at = BEATS[chip.beat] + 0.02 + chip.d;
  const pathLength = useTransform(p, [at, at + 0.07], [0, 1]);
  const cx = parseFloat(chip.left);
  const cy = parseFloat(chip.top);
  const qx = (cx + STAGE_CENTER.x) / 2;
  const qy = cy < 50 ? Math.min(cy, STAGE_CENTER.y) - 6 : Math.max(cy, STAGE_CENTER.y) + 4;
  const pad = 1.5;
  const x0 = Math.min(cx, qx, STAGE_CENTER.x) - pad;
  const x1 = Math.max(cx, qx, STAGE_CENTER.x) + pad;
  const y0 = Math.min(cy, qy, STAGE_CENTER.y) - pad;
  const y1 = Math.max(cy, qy, STAGE_CENTER.y) + pad;
  return (
    <svg
      className="absolute overflow-visible"
      style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }}
      viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`}
      preserveAspectRatio="none"
    >
      <motion.path
        d={`M ${cx} ${cy} Q ${qx} ${qy} ${STAGE_CENTER.x} ${STAGE_CENTER.y}`}
        fill="none"
        stroke="hsl(222 84% 53% / 0.45)"
        strokeWidth={0.18}
        strokeLinecap="round"
        style={{ pathLength }}
      />
    </svg>
  );
}

function StageMesh({ p }: { p: P }) {
  const opacity = useTransform(p, [0.08, 0.22], [WAIT, 1]);
  const yDots = useTransform(p, [0, 1], [0, -70]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%)]"
      style={{ opacity, willChange: "opacity" }}
    >
      {MESH.map((m, i) => (
        <MeshBlob key={i} p={p} m={m} />
      ))}
      <motion.div
        className="absolute inset-0 dot-grid opacity-55"
        style={{ y: yDots, willChange: "transform" }}
      />
    </motion.div>
  );
}

function MeshBlob({ p, m }: { p: P; m: (typeof MESH)[number] }) {
  const y = useTransform(p, [0, 1], [0, m.drift]);
  return (
    <motion.div
      className="absolute"
      style={{ width: m.size, height: m.size, left: m.left, top: m.top, y, willChange: "transform" }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(${m.color} / 0.3) 0%, hsl(${m.color} / 0.14) 30%, transparent 72%)`,
          opacity: 0.65,
        }}
      />
    </motion.div>
  );
}

function Rail({ p }: { p: P }) {
  const [beat, setBeat] = useState(-1);
  useMotionValueEvent(p, "change", (v) => {
    let i = -1;
    for (let k = 0; k < BEATS.length; k++) if (v >= BEATS[k]) i = k;
    if (v >= FINAL) i = BEATS.length;
    setBeat(i);
  });
  const n = Math.min(Math.max(beat, 0), ITEMS.length - 1) + 1;
  return (
    <div className="pointer-events-none absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2.5">
      <span
        className={`mb-1 font-mono-label text-[11px] tabular-nums transition-opacity duration-300 ${
          beat >= 0 && beat < ITEMS.length ? "text-primary opacity-100" : "opacity-0"
        }`}
      >
        0{n}
      </span>
      {ITEMS.map((item, i) => (
        <span
          key={item.tag}
          className={`block h-1.5 w-1.5 rounded-full transition-all duration-500 ${
            beat === i ? "scale-125 bg-primary" : "bg-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}

function Stacked() {
  return (
    <section id="what-we-build" className="relative border-b border-border py-20">
      <div className="mx-auto max-w-[1400px] px-5">
        <h2 className="text-[1.75rem]">This is what we hand you.</h2>
        <p className="mt-4 max-w-[560px] text-[17px] text-muted-foreground">
          Real interfaces, built for your process, not another tool to log into.
        </p>
        <div className="mt-12 flex flex-col gap-16">
          {ITEMS.map((item) => {
            const Preview = item.Preview;
            return (
              <div key={item.tag}>
                <PreviewCard>
                  <Preview />
                </PreviewCard>
                <div className="mt-5">
                  <span className="font-mono-label text-[11px] text-primary">{item.tag}</span>
                  <h3 className="mt-2 text-[1.4rem]">{item.title}</h3>
                  <p className="mt-2 text-[16px] text-muted-foreground">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
