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
import { stageScroll } from "../../lib/stage-scroll";
import PreviewCard from "../ui/PreviewCard";
import { CalendarCard, SATELLITE_CARDS, SmsCard } from "../previews/Satellites";
import LeadPipeline from "../previews/LeadPipeline";
import InvoiceExtraction from "../previews/InvoiceExtraction";
import OpsDashboard from "../previews/OpsDashboard";
import AgentInbox from "../previews/AgentInbox";

/*
  A pinned scroll story, built the way Activepieces builds theirs: the section
  is several viewports tall, a 100vh stage sticks to the top, and one scroll
  progress value (0 → 1 across the whole section) drives every layer.

  Beats, in progress units (1.0 = STAGE_VH of scroll). The section starts
  OVERLAP_VH above the hero's bottom edge (that tail is padding and the
  Mac's glow), so the stage is already rising under the hero on the first
  pixel of scroll. It pins at ~0.23.
    0.13 – 0.20  the intro sentence rides up, dead centre of the stage, its
                 words resolving as it comes (driven by RAW scroll, see below)
    0.227        stage pins with the sentence centred
    0.24 – 0.28  sentence dissolves; window 1 flies in (perspective tilt),
                 its text rises, chips pop, an accent spotlight warms the backdrop
    0.36 / 0.48 / 0.6  previous window parks, next one flies in
    0.72         the closing desk: four apps plus satellite cards fly in from
                 every edge, tilted and overlapping; "This is what we hand you."
                 The desk then holds until ~0.97 before a short lift into honeycomb.

  Two rules that keep the start smooth. Nothing lands before the stage is
  pinned (a window settling into a frame that is still moving reads as
  jank). And nothing visible before the pin is driven by the spring: while
  the stage itself is still scrolling natively, spring-lagged content swims
  against it. Pre-pin elements take `raw`; everything after takes `p`.

  Performance rules for this file. Chrome only moves an element for free (on
  the compositor, no repaint) when that element is its own layer. A JS-set
  transform/opacity on an element that is NOT a layer re-rasterizes the layer
  it lives in, which here is the whole 100vh sticky stage, every frame. A
  trace of the previous version showed exactly that: ~50% dropped frames,
  all of it raster. So every element whose style is driven by scroll gets
  GPU (will-change), full stop. Textures are rasterized once and then only
  composited. No filter: blur(), no mix-blend-mode, nothing else that needs
  a repaint per frame.
*/

const GPU = { willChange: "transform, opacity" } as const;

const STAGE_VH = 500;
const OVERLAP_VH = 24;
const BEAT = 0.12;
const BEATS = [0.24, 0.36, 0.48, 0.6];
const FINAL = BEATS[3] + BEAT; // 0.72
// Windows sit invisibly at the centre until PRELOAD before their beat, so
// their textures are rasterized long before they move (see Window).
const PRELOAD = 0.03;
const WAIT = 1 / 255;
const FLY = 0.055;
const RISE = 0.05; // words of a title finish rising within this window
const EXIT = 0.03;
const PARK_SCALE = 0.5;

type Item = {
  tag: string;
  host: string;
  title: string;
  copy: string;
  accent: string; // hsl triplet for the backdrop spotlight
  size?: number; // base scale, for a preview taller than the others
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

// Where each window enters from (off-screen), where it parks once the next
// one arrives, and where it ends up in the closing grid.
// ry/rx are perspective tilts: a window entering from the left is turned
// toward the viewer and flattens out as it lands.
const ORIGINS = [
  { x: "-110vw", y: "-24vh", r: -7, ry: 34, rx: 6 },
  { x: "110vw", y: "-30vh", r: 6, ry: -34, rx: 6 },
  { x: "-90vw", y: "60vh", r: 8, ry: 28, rx: -18 },
  { x: "90vw", y: "55vh", r: -8, ry: -28, rx: -18 },
];
const PARK = [
  { x: "-37vw", y: "-33vh", r: -3 },
  { x: "37vw", y: "-33vh", r: 3 },
  { x: "-37vw", y: "14vh", r: 2 },
  { x: "37vw", y: "14vh", r: -2 },
];
// Closing arrangement: a desk of real apps filling the frame edge to edge,
// tilted and overlapping, the way Activepieces closes its stage. Each has
// its own size (s), tilt (r) and depth. Bigger = nearer, and nearer windows
// drift further (drift, vh) over the last stretch of the stage, so the group
// has parallax depth while "This is what we hand you" holds in the middle.
// Positions are relative to the stage anchor (50%, 63%). Outer edges run
// past the viewport on purpose; inner edges tuck under the centre scrim.
// The mockup's desk: lead routing and document processing are the two big
// cards across the top, the ops dashboard and the agent inbox tuck in behind
// them as the second card in each stack (z below, so only an edge shows),
// and the bottom band belongs to the satellites.
const FINAL_SLOTS = [
  { x: "-32vw", y: "-31vh", r: -4, s: 0.88, drift: -3, z: 13 },
  { x: "32vw", y: "-31vh", r: 4, s: 0.88, drift: -3, z: 13 },
  { x: "-38vw", y: "-40vh", r: -9, s: 0.50, drift: -2, z: 9 },
  { x: "38vw", y: "-40vh", r: 9, s: 0.50, drift: -2, z: 9 },
];

// Satellite cards: small static app moments (a Slack ping, a calendar hold,
// a filed bill…) that fly in around the four windows at the close and fill
// the gaps, so the ending reads as a whole company's tooling, not four
// tiles. Static content, so each is rasterized once. `from` is the edge it
// enters from; x/y are the resting slot (relative to the stage anchor).
// Widths are vw-based (px-capped) so the desk holds the mockup's proportions
// on a 1280 laptop and a 2560 display alike; at fixed px the whole band shrank
// into the middle of a wide screen and left the bottom third empty.
// The calendar and the SMS card share a drift so the arrow between them keeps
// its aim through the closing parallax.
const SATELLITES = [
  { id: "slack", x: "0vw", y: "-39vh", r: 2, w: "min(30vw, 540px)", d: 0, drift: -3, from: { x: "0vw", y: "-95vh" } },
  { id: "calendar", x: "1vw", y: "27vh", r: -2, w: "min(25vw, 460px)", d: 0.006, drift: -3, from: { x: "1vw", y: "92vh" } },
  { id: "quickbooks", x: "-19vw", y: "-26vh", r: 4, w: "min(25vw, 460px)", d: 0.012, drift: -4, from: { x: "-95vw", y: "-26vh" } },
  { id: "docusign", x: "19vw", y: "-25vh", r: -4, w: "min(25vw, 460px)", d: 0.018, drift: -4, from: { x: "95vw", y: "-25vh" } },
  { id: "sheets", x: "-31vw", y: "19vh", r: 2, w: "min(27vw, 500px)", d: 0.024, drift: -3, from: { x: "-95vw", y: "19vh" } },
  { id: "sms", x: "26vw", y: "16vh", r: -3, w: "min(23vw, 420px)", d: 0.03, drift: -3, from: { x: "95vw", y: "16vh" } },
] as const;

// Three chips per beat, spread around the ring so every beat adds motion in
// a different part of the frame. Slots avoid the nav, the copy and the
// parking corners.
const CHIPS = [
  { slug: "gmail", label: "Gmail", left: "27%", top: "9.5%", beat: 0, d: 0 },
  { slug: "hubspot", label: "HubSpot", left: "73%", top: "9.5%", beat: 0, d: 0.012 },
  { slug: "twilio", label: "Twilio", left: "50%", top: "95%", beat: 0, d: 0.024 },
  { slug: "quickbooks", label: "QuickBooks", left: "6%", top: "50%", beat: 1, d: 0 },
  { slug: "google-drive", label: "Drive", left: "94%", top: "50%", beat: 1, d: 0.012 },
  { slug: "docusign", label: "DocuSign", left: "14%", top: "9.5%", beat: 1, d: 0.024 },
  { slug: "google-sheets", label: "Sheets", left: "9%", top: "94%", beat: 2, d: 0 },
  { slug: "slack", label: "Slack", left: "91%", top: "94%", beat: 2, d: 0.012 },
  { slug: "salesforce", label: "Salesforce", left: "86%", top: "9.5%", beat: 2, d: 0.024 },
  { slug: "google-calendar", label: "Calendar", left: "69%", top: "95%", beat: 3, d: 0 },
  { slug: "intercom", label: "Intercom", left: "31%", top: "95%", beat: 3, d: 0.012 },
];

const STAGE_CENTER = { x: 50, y: 63 };

const MESH = [
  { color: "245 100% 68%", size: 620, left: "-6%", top: "-14%", drift: -160 },
  { color: "217 91% 56%", size: 560, left: "58%", top: "-10%", drift: -260 },
  { color: "191 90% 52%", size: 480, left: "28%", top: "62%", drift: -120 },
];

type P = MotionValue<number>;

const DESKTOP = "(min-width: 1024px)";

// Every range handed to useTransform must sit inside [0, 1] (see Beat).
const c = (n: number) => Math.min(1, Math.max(0, n));

export default function HandoffStage() {
  const reduced = !!useReducedMotion();
  // Read the media query during the first render. Starting from `false` and
  // fixing it in an effect mounted the mobile layout (and all four live
  // previews) first, then threw it away and mounted the stage.
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!desktop || reduced) return <Stacked />;
  return <Stage />;
}

/* ------------------------------------------------------------------ stage */

function Stage() {
  const ref = useRef<HTMLElement>(null);
  // Same as ["start end", "end end"], but spelled so it does not match one of
  // Framer's ViewTimeline presets. The native ScrollTimeline path turns each
  // useTransform range into WAAPI keyframes, and keyframes that begin after
  // offset 0 inherit the element's base style, which breaks every mid-range
  // beat below. The JS path tracks progress exactly.
  const { scrollYProgress: raw } = useScroll({
    target: ref,
    offset: ["start 100%", "end 100%"],
  });
  useMotionValueEvent(raw, "change", (v) => stageScroll.set(v));
  useLayoutEffect(() => {
    stageScroll.set(raw.get());
  }, [raw]);
  // A stiff, well-damped spring between the scroll position and the scene.
  // It smooths wheel steps into continuous motion without noticeable lag.
  const p = useSpring(raw, { stiffness: 620, damping: 58, mass: 0.4, restDelta: 0.0002 });

  // The tallest preview is ~520px. Shrink windows on short viewports so the
  // centred one clears the copy above it and the stage floor below.
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const sync = () => setFit(Math.min(1, (window.innerHeight * 0.6) / 540));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Big layers idle at WAIT (1/255), not 0, so they are rasterized while the
  // page is idle instead of on the frame they first appear.
  const topScrim = useTransform(
    p,
    [BEATS[0] - 0.02, BEATS[0] + 0.04, FINAL, FINAL + 0.05],
    [WAIT, 1, 1, WAIT],
  );
  const centerScrim = useTransform(p, [FINAL, FINAL + 0.06], [WAIT, 1]);
  // Close desk holds until ~0.97, then a short lift into the honeycomb.
  const liftY = useTransform(p, [0.97, 1], [0, -64]);
  const liftOp = useTransform(p, [0.975, 1], [1, 0.7]);

  return (
    <section
      ref={ref}
      id="what-we-build"
      // pointer-events-none because the section overlaps the hero's tail; the
      // previews re-enable pointer events on themselves.
      className="pointer-events-none relative"
      style={{ height: `${STAGE_VH}vh`, marginTop: `-${OVERLAP_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
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

        {/*
          Scrims keep the copy readable where it overlaps the windows. Each is
          sized to its gradient's bounding box (the ellipse is transparent
          beyond it anyway), so the texture is a third of a full-viewport one.
          Same pixels on screen.
        */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[40%]"
          style={{
            opacity: topScrim,
            ...GPU,
            // 20% of the stage = 50% of this 40%-tall box; 17% radius = 42.5%.
            background:
              "radial-gradient(ellipse 48% 42.5% at 50% 50%, hsl(220 40% 99%) 40%, hsl(220 40% 99% / 0.82) 60%, hsl(220 40% 99% / 0.3) 82%, transparent 100%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[30%] z-20 h-[36%]"
          style={{
            opacity: centerScrim,
            ...GPU,
            background:
              "radial-gradient(ellipse 52% 58% at 50% 48%, hsl(220 40% 99%) 46%, hsl(220 40% 99% / 0.86) 64%, hsl(220 40% 99% / 0.35) 82%, transparent 100%)",
          }}
        />

        {/* Intro: rides up with the stage, so it takes raw scroll, not the spring. */}
        <Beat
          p={raw}
          center
          title="Tell us what eats your team's week."
          enter={[0.13, 0.2]}
          exit={[BEATS[0] - EXIT, BEATS[0]]}
        />

        {/* One beat per window */}
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

        {/* Close */}
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

/* --------------------------------------------------------------- windows */

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

  // Texture warm-up. Chrome only rasterizes what is on screen, so a window
  // waiting off-screen at its origin gets rasterized (~10 MB at 2x) in the
  // very frame it starts flying in: a visible hitch on every beat. Instead
  // the window waits AT THE CENTRE at 1/255 opacity (one grey level: not
  // perceptible, but > 0 so the compositor draws it and its tiles exist),
  // fades to 0, snaps to the off-screen origin while at 0, and flies in with
  // its texture already built.
  const t0 = b0 - PRELOAD; // fade-out to 0 begins
  const t1 = b0 - 0.012; // at 0; snap to origin starts
  // Windows after the first only start their warm-up once the previous
  // window has landed on top of them, so nothing is ever drawn over an
  // empty stage but a single 1/255 layer.
  const w0 = i > 0 ? BEATS[i - 1] + FLY + 0.02 : 0;
  // Keyframe times: (centre → origin, invisible,) fly in, (park when the next
  // window arrives,) settle into the closing slot, then drift with depth.
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
  const scale = useTransform(
    p,
    times,
    seq(0.92 * k, k, PARK_SCALE * k, f.s * k),
  );
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
  // Only a window you can actually see should take clicks (the ops tabs).
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? "auto" : "none"));

  const Preview = item.Preview;

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2"
      style={{ width: "min(46vw, 680px)", zIndex: f.z }}
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
          pointerEvents,
          transformPerspective: 1400,
          ...GPU,
        }}
      >
        {/* Idle bob so a held window never looks frozen. */}
        <div className="stage-float" style={{ animationDelay: `${-i * 1.7}s` }}>
        <PreviewCard>
          <div className="relative flex items-center border-b border-border bg-[hsl(220_24%_96%)] px-3.5 py-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="absolute left-1/2 flex w-[46%] -translate-x-1/2 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 py-1">
              <img src="/favicon.svg?v=4" alt="" className="h-3 w-3" />
              <span className="truncate text-[12px] font-medium text-muted-foreground">
                {item.host}
              </span>
            </div>
            <span className="ml-auto font-mono-label text-[10px] text-primary">
              {item.tag}
            </span>
          </div>
          <Preview />
        </PreviewCard>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------ satellites */

// Same warm-up trick as Window: the card waits in its resting slot at 1/255
// opacity (so its texture exists), drops to 0, snaps to its entry edge, and
// flies in during the close. Cards sit above the four windows (z 15) and
// under the centre scrim, so they read as a second layer on the desk.
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
  const isStory = sat.id === "calendar" || sat.id === "sms";
  const [play, setPlay] = useState(false);
  useMotionValueEvent(p, "change", (v) => {
    if (!isStory || play) return;
    if (v >= FINAL + 0.04 + FLY) setPlay(true);
  });
  useLayoutEffect(() => {
    if (!isStory) return;
    if (p.get() >= FINAL + 0.04 + FLY) setPlay(true);
  }, [p, isStory]);
  const Card = SATELLITE_CARDS[sat.id];
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      style={{
        width: sat.w,
        zIndex: sat.id === "calendar" ? 24 : sat.id === "sms" ? 23 : sat.id === "sheets" ? 22 : 15,
      }}
    >
      <motion.div style={{ x, y, rotate, scale, opacity, ...GPU }}>
        <div className="stage-float overflow-visible" style={{ animationDelay: `${-i * 1.1 - 0.6}s` }}>
          {sat.id === "calendar" ? (
            <CalendarCard play={play} />
          ) : sat.id === "sms" ? (
            <SmsCard play={play} />
          ) : (
            <Card />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------- spotlight */

// A coloured wash behind the active window. Only opacity animates, so this is
// a single composited layer per item. The box is the wash's visible extent
// (it was 80vw × 90vh with the gradient transparent past 72%; the ellipse is
// scaled up by 1/0.72 so the pixels are identical at half the texture).
function Spot({ p, i, color }: { p: P; i: number; color: string }) {
  const b0 = BEATS[i];
  const b1 = i < BEATS.length - 1 ? BEATS[i + 1] : FINAL;
  const opacity = useTransform(p, [b0, b0 + FLY, b1 - EXIT, b1 + 0.02], [WAIT, 1, 1, WAIT]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-[6] h-[64.8vh] w-[57.6vw] -translate-x-1/2 -translate-y-1/2"
      style={{
        top: `${STAGE_CENTER.y}%`,
        opacity,
        willChange: "opacity",
        background: `radial-gradient(ellipse 69.44% 69.44% at 50% 50%, hsl(${color} / 0.22), hsl(${color} / 0.08) 45%, transparent 72%)`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ text */

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

  // Ranges must stay inside [0, 1]: Framer feeds them to the browser's
  // ScrollTimeline as keyframe offsets. A beat with no exit just holds.
  const ex = exit ?? [0.99, 1];
  const exitTo = exit ? 1 : 0;
  const opacity = useTransform(p, [ex[0], ex[1]], [1, 1 - exitTo]);
  const y = useTransform(p, [ex[0], ex[1]], [0, -30 * exitTo]);

  const tagOp = useTransform(p, [enter[0] - 0.01, enter[0] + 0.02], [0, 1]);
  const tagY = useTransform(p, [enter[0] - 0.01, enter[0] + 0.02], [10, 0]);
  const copyIn = [c(enter[1] - step * 2), c(enter[1] + 0.02)];
  const copyOp = useTransform(p, copyIn, [0, 1]);
  const copyY = useTransform(p, copyIn, [16, 0]);
  const markOp = useTransform(p, [enter[0] - 0.015, enter[0] + 0.02], [0, 1]);
  const markSc = useTransform(p, [enter[0] - 0.015, enter[0] + 0.02], [0.6, 1]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-8 ${
        mark ? "top-[38%]" : center ? "inset-y-0 items-center" : "top-[11%]"
      }`}
    >
      <motion.div
        className="flex max-w-[860px] flex-col items-center text-center"
        style={{ opacity, y, ...GPU }}
      >
        {mark && (
          <motion.img
            src="/favicon.svg?v=6"
            alt=""
            className="mb-6 h-14 w-14"
            style={{ opacity: markOp, scale: markSc, ...GPU }}
          />
        )}
        {tag && (
          <motion.span
            className="mb-4 font-mono-label text-[11px] text-primary"
            style={{ opacity: tagOp, y: tagY, ...GPU }}
          >
            {tag}
          </motion.span>
        )}
        <h2
          className={`text-balance ${
            center
              ? "text-[clamp(2.6rem,7vh,4.25rem)]"
              : "text-[clamp(1.9rem,4.6vh,3rem)]"
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
            className="relative mt-4 max-w-[620px] text-[clamp(15px,2vh,17px)] leading-[1.6] text-muted-foreground"
            style={{ opacity: copyOp, y: copyY, ...GPU }}
          >
            {mark && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[170%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(220_40%_98%/0.58)] backdrop-blur-[8px]"
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
  const y = useTransform(p, [t0, t1], [22, 0]);
  const opacity = useTransform(p, [t0, t1], [0, 1]);
  return (
    <motion.span className="mr-[0.25em] inline-block" style={{ y, opacity, ...GPU }}>
      {word}
    </motion.span>
  );
}

/* ----------------------------------------------------------- chips/wires */

function Chip({ p, chip }: { p: P; chip: (typeof CHIPS)[number] }) {
  const at = BEATS[chip.beat] + 0.02 + chip.d;
  const opacity = useTransform(p, [at, at + 0.035, FINAL, FINAL + FLY * 0.6], [0, 1, 1, 0]);
  const scale = useTransform(p, [at, at + 0.045, FINAL, FINAL + FLY], [0.7, 1, 1, 0.8]);
  const y = useTransform(p, [at, at + 0.045], [16, 0]);

  return (
    <div
      className="pointer-events-none absolute z-[8] -translate-x-1/2 -translate-y-1/2"
      style={{ left: chip.left, top: chip.top }}
    >
      <motion.div
        className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 soft-shadow"
        style={{ opacity, scale, y, ...GPU }}
      >
        <img
          src={`/logos/${chip.slug}.png`}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] object-contain"
        />
        <span className="text-[13px] font-medium text-foreground">{chip.label}</span>
      </motion.div>
    </div>
  );
}

// Each wire is its own small SVG sized to the path's bounding box, in the
// same 0–100 stage coordinate space. A wire drawing in repaints only its own
// box instead of a full-viewport SVG. Scale is identical to one big SVG
// because 1 user unit is always 1% of the stage.
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
  // Bow the wire toward the vertical midline so it reads as a cable, not a ray.
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
        strokeWidth={0.1}
        strokeLinecap="round"
        style={{ pathLength }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------- backdrop */

function StageMesh({ p }: { p: P }) {
  const opacity = useTransform(p, [0.08, 0.22], [WAIT, 1]);
  const yDots = useTransform(p, [0, 1], [0, -90]);
  return (
    <motion.div
      aria-hidden
      // Top edge fades in so the backdrop blends with the hero's mesh bleed
      // while the stage is still sliding into place.
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%)]"
      style={{ opacity, willChange: "opacity" }}
    >
      {MESH.map((m, i) => (
        <MeshBlob key={i} p={p} m={m} />
      ))}
      {/*
        The dot grid is the most expensive paint on the page (a gradient tile
        every 22px across the viewport). Promoted, it is rasterized once and
        the parallax is a compositor translate.
      */}
      <motion.div
        className="absolute inset-0 dot-grid opacity-60"
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
          background: `radial-gradient(circle at 50% 50%, hsl(${m.color} / 0.3) 0%, hsl(${m.color} / 0.16) 28%, hsl(${m.color} / 0.05) 52%, transparent 72%)`,
          opacity: 0.6,
        }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ rail */

// The rail is the only thing that needs React state per beat, so it holds
// that state itself. Keeping it out of Stage means a beat change re-renders
// four dots, not four live previews.
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
    <div className="pointer-events-none absolute right-8 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3">
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
          className={`block h-1.5 rounded-full transition-all duration-500 ${
            beat === i ? "w-1.5 scale-125 bg-primary" : "w-1.5 bg-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------- mobile / reduced */

function Stacked() {
  return (
    <section id="what-we-build" className="relative border-b border-border py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 className="text-[1.75rem] sm:text-[2.5rem]">This is what we hand you.</h2>
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
