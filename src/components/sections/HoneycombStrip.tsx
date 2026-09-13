import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useMotionValueEvent } from "framer-motion";
import { stageScroll } from "../../lib/stage-scroll";

/** Desk lift starts at 0.88; the strip peeks in the last ~22vh (~0.05 of the
 *  440vh stage). Fire the entrance when that peek actually appears. */
const JOIN_AT = 0.945;

// Business apps only. Apps not currently on screen sit in a shared free pool;
// when a cell flips it takes the pool's head and returns its old app to the
// tail, so any app is in exactly one cell or in the pool - never two cells.
const APPS = [
  "stripe", "shopify", "hubspot", "salesforce", "quickbooks", "gmail", "slack",
  "google-sheets", "notion", "airtable", "calendly", "asana", "pipedrive", "xero",
  "zoom", "microsoft-teams", "intercom", "zendesk", "twilio", "docusign",
  "mailchimp", "openai", "github", "figma", "dropbox", "paypal", "square",
  "klaviyo", "sendgrid", "typeform", "google-drive", "google-calendar", "clickup",
  "jira", "webflow", "wordpress", "woocommerce", "linear", "monday", "confluence",
  "canva", "trello", "gitlab", "google-docs", "google-forms", "microsoft-outlook",
  "freshdesk", "zoho-crm", "activecampaign", "brevo", "clockify", "bamboohr",
  "bigcommerce", "amazon-s3", "vercel", "supabase", "firebase", "mongodb",
  "postgres", "mysql", "snowflake", "smartsheet", "coda", "todoist", "cal-com",
  "apollo", "lemlist", "elevenlabs", "ringcentral", "aircall", "crisp",
  "help-scout", "pandadoc", "tally", "surveymonkey", "mixpanel", "segment",
  "posthog", "datadog", "pagerduty", "wrike", "deepl", "convertkit", "chargebee",
  "recurly", "paddle", "whatsapp",
] as const;

const W = 78;
const GAP = 4;
const H = Math.round(W / 0.866);
const DX = W + GAP;
const DY = H * 0.75 + GAP * 0.87;
const ROWS = 4;
const BAND_H = Math.round((ROWS - 1) * DY + H);

type Slug = (typeof APPS)[number];
type Handle = { card: HTMLDivElement; face: HTMLDivElement; swap: () => void };

function Cell({
  idx,
  col,
  row,
  free,
  canSwap,
  register,
}: {
  idx: number;
  col: number;
  row: number;
  free: Slug[];
  canSwap: boolean;
  register: (idx: number, h: Handle) => () => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const cur = useRef<Slug>(APPS[idx]);

  const swap = useCallback(() => {
    const next = free.shift();
    if (!next) return;
    free.push(cur.current);
    cur.current = next;
    if (img.current) img.current.src = `/logos/${next}.png`;
  }, [free]);

  useEffect(() => {
    if (!card.current || !face.current) return;
    return register(idx, { card: card.current, face: face.current, swap });
  }, [idx, register, swap]);

  const style = { "--c": col, "--r": row } as CSSProperties;

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width: W,
        height: H,
        transform: `translate(${col * DX + (row % 2 ? DX / 2 : 0)}px, ${row * DY}px)`,
        ...style,
      }}
    >
      <div className="comb-from-right" style={style}>
      <div
        ref={card}
        className="comb-card"
        style={style}
        onAnimationIteration={canSwap ? swap : undefined}
      >
        <div className="comb-side">
          <div className="comb-face comb-blank" />
        </div>
        <div className="comb-side comb-back">
          <div ref={face} className="comb-face">
            <img
              ref={img}
              src={`/logos/${cur.current}.png`}
              alt=""
              width={36}
              height={36}
              className="pointer-events-none h-9 w-9 object-contain"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const ADD = { composite: "add" as const };

// Solo moves layered additively on the wave so they never fight it.
const MOVES: Array<(h: Handle) => Animation> = [
  (h) =>
    h.card.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.16)", offset: 0.4 }, { transform: "scale(1)" }],
      { duration: 700, easing: SPRING, ...ADD },
    ),
  (h) =>
    h.card.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-9px)", offset: 0.4 }, { transform: "translateY(0)" }],
      { duration: 800, easing: SPRING, ...ADD },
    ),
  (h) =>
    h.card.animate(
      [
        { transform: "rotate(0)" },
        { transform: "rotate(7deg)", offset: 0.25 },
        { transform: "rotate(-6deg)", offset: 0.55 },
        { transform: "rotate(3deg)", offset: 0.8 },
        { transform: "rotate(0)" },
      ],
      { duration: 900, easing: "ease-in-out", ...ADD },
    ),
  (h) => {
    const a = h.card.animate(
      [
        { transform: "rotateY(0) scale(1)" },
        { transform: "rotateY(180deg) scale(1.1)", offset: 0.5 },
        { transform: "rotateY(360deg) scale(1)" },
      ],
      { duration: 1000, easing: "cubic-bezier(.4,0,.2,1)", ...ADD },
    );
    setTimeout(h.swap, 500);
    return a;
  },
  (h) =>
    h.face.animate(
      [
        { boxShadow: "inset 0 0 0 0 hsl(222 84% 53% / 0)" },
        { boxShadow: "inset 0 0 0 3px hsl(222 84% 53% / 0.9)", offset: 0.3 },
        { boxShadow: "inset 0 0 0 0 hsl(222 84% 53% / 0)" },
      ],
      { duration: 1200, easing: "ease-out" },
    ),
];

export default function HoneycombStrip() {
  const band = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const [arrived, setArrived] = useState(() => stageScroll.get() >= JOIN_AT);
  const [canSwap, setCanSwap] = useState(false);
  const handles = useRef(new Map<number, Handle>());

  const register = useCallback((idx: number, h: Handle) => {
    handles.current.set(idx, h);
    return () => {
      handles.current.delete(idx);
    };
  }, []);

  useLayoutEffect(() => {
    const el = band.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth || el.getBoundingClientRect().width;
      if (!w) return;
      setWidth((prev) => {
        if (!prev) return w;
        const prevCols = Math.ceil(prev / DX) + 1;
        const nextCols = Math.ceil(w / DX) + 1;
        return prevCols === nextCols ? prev : w;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMotionValueEvent(stageScroll, "change", (v) => {
    if (v >= JOIN_AT) setArrived(true);
  });

  useEffect(() => {
    if (stageScroll.get() >= JOIN_AT) setArrived(true);
  }, []);

  useEffect(() => {
    const el = band.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: "25% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobile / reduced-motion stacked stage never writes progress. Arrive
  // only when the band is actually on screen and the pinned stage isn't mid-story.
  useEffect(() => {
    if (arrived || !active || !band.current) return;
    if (stageScroll.get() > 0.05 && stageScroll.get() < JOIN_AT) return;
    const top = band.current.getBoundingClientRect().top;
    if (stageScroll.get() < 0.05 && top < window.innerHeight * 0.8) setArrived(true);
  }, [active, arrived]);

  useEffect(() => {
    if (!arrived) {
      setCanSwap(false);
      return;
    }
    const id = window.setTimeout(() => setCanSwap(true), 1800);
    return () => window.clearTimeout(id);
  }, [arrived]);

  const rawCols = width ? Math.ceil(width / DX) + 1 : 0;
  const cols = rawCols ? Math.min(rawCols, Math.floor(APPS.length / ROWS)) : 0;
  const n = cols * ROWS;
  // Apps not placed in the initial grid. Mutated by cells as they flip.
  const free = useMemo<Slug[]>(() => APPS.slice(n) as Slug[], [n]);

  useEffect(() => {
    if (!active || !arrived || !canSwap || !cols) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const busy = new Set<number>();
    const id = window.setInterval(() => {
      const idle: number[] = [];
      handles.current.forEach((_, idx) => {
        const row = Math.floor(idx / cols);
        if (!busy.has(idx) && row > 0 && row < ROWS - 1) idle.push(idx);
      });
      if (!idle.length) return;
      const idx = idle[Math.floor(Math.random() * idle.length)];
      const h = handles.current.get(idx);
      if (!h) return;
      busy.add(idx);
      const a = MOVES[Math.floor(Math.random() * MOVES.length)](h);
      a.onfinish = () => busy.delete(idx);
    }, 300);
    return () => window.clearInterval(id);
  }, [active, arrived, canSwap, cols]);

  return (
    <section
      id="connections"
      className="relative -mt-[22vh] pb-6 pt-10"
      style={{
        background: "linear-gradient(to bottom, transparent, hsl(220 40% 98%) 40%)",
      }}
    >
      <div className="relative mx-auto mb-5 max-w-[640px] px-5 text-center sm:px-8">
        <p className="mb-2 font-mono-label text-[11px] text-[hsl(222_84%_53%)]">
          80+ connections
        </p>
        <h2 className="text-[1.35rem] tracking-tight text-foreground sm:text-[1.6rem]">
          Connected to the tools you already run
        </h2>
      </div>
      <div
        ref={band}
        className={`relative overflow-hidden ${arrived ? "comb-in" : ""} ${arrived && active ? "" : "comb-paused"}`}
        style={{
          height: BAND_H,
          perspective: 1400,
          ["--cols" as string]: Math.max(cols, 18),
          maskImage:
            "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        {n > 0 && (
          <div
            key={cols}
            className="absolute top-0"
            style={{ left: (width - cols * DX) / 2, width: cols * DX, height: BAND_H }}
          >
            {Array.from({ length: n }, (_, idx) => (
              <Cell
                key={idx}
                idx={idx}
                col={idx % cols}
                row={Math.floor(idx / cols)}
                free={free}
                canSwap={canSwap}
                register={register}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
