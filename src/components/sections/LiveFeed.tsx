import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TURNS, AMBIENT, STATS, type FeedStat } from "../../content/feed";

const EASE_SOFT = [0.4, 0, 0.2, 1] as const;

/** Most rows kept on screen at once. Older rows drop off the top. */
const MAX_ROWS = 8;

/** Ambient events to let through before someone types again. */
const AMBIENT_RUN = () => 3 + Math.floor(Math.random() * 4);

const shuffled = <T,>(list: readonly T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const clockNow = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function Stat({
  stat,
  run,
  activeRef,
}: {
  stat: FeedStat;
  run: boolean;
  activeRef: React.RefObject<boolean>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = !!useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!run || !el) return;
    if (reduced) {
      el.textContent = stat.value.toLocaleString();
      return;
    }
    const t0 = performance.now();
    let last = t0;
    let onScreenMs = 0;
    let raf = 0;
    // Bound the drift so a tab left open all afternoon doesn't inflate the figure.
    const climbCap = stat.value * 0.02;
    const tick = (now: number) => {
      if (activeRef.current) onScreenMs += now - last;
      last = now;
      const t = Math.min(1, (now - t0) / 2200);
      const intro = stat.value * (1 - Math.pow(1 - t, 3));
      // Only start climbing once the intro count has landed.
      const climb =
        t < 1 ? 0 : Math.min(climbCap, (stat.perMinute * onScreenMs) / 60000);
      el.textContent = Math.round(intro + climb).toLocaleString();
      if (t < 1 || (stat.perMinute > 0 && climb < climbCap)) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced, stat.value, stat.perMinute, activeRef]);

  return (
    <div className="hairline rounded-2xl bg-card px-4 py-3.5">
      <div className="font-heading text-[1.9rem] font-semibold leading-none tracking-tight">
        <span ref={ref}>0</span>
        {stat.suffix && <span className="text-primary">{stat.suffix}</span>}
      </div>
      <div className="font-mono-label mt-1.5 text-[10px] text-muted-foreground">
        {stat.label}
      </div>
    </div>
  );
}

type Row =
  | { id: number; kind: "prompt"; text: string; typed: string; state: "typing" | "working" | "done" }
  | { id: number; kind: "result"; logo: string; text: string; time: string };

function PromptRow({ row }: { row: Extract<Row, { kind: "prompt" }> }) {
  return (
    <div className="rounded-xl bg-foreground px-4 py-3.5 text-[13.5px] leading-[1.5] text-primary-foreground">
      <span className="font-mono-label mb-1.5 block text-[10px] text-[hsl(220_20%_62%)]">
        You
      </span>
      <span>{row.typed}</span>
      {row.state === "typing" && <span aria-hidden className="feed-caret" />}
      {row.state === "working" && (
        <span aria-hidden className="feed-dots">
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

function ResultRow({ row }: { row: Extract<Row, { kind: "result" }> }) {
  return (
    <div className="hairline grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 text-[13px]">
      <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-[hsl(220_20%_94%)]">
        <img
          src={`/logos/${row.logo}.webp`}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="truncate">{row.text}</span>
      <time className="font-mono-label text-[10px] text-muted-foreground">{row.time}</time>
    </div>
  );
}

export default function LiveFeed() {
  const section = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const [rows, setRows] = useState<Row[]>([]);
  const rowsEmpty = useRef(true);
  const reduced = !!useReducedMotion();

  const nextId = useRef(0);
  const turnAt = useRef(0);
  // Ambient events are drawn from a reshuffled bag so repeats stay far apart.
  const bag = useRef<{ items: typeof AMBIENT; at: number }>({ items: [], at: 0 });

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        activeRef.current = e.isIntersecting;
        setActive(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The feed runs only while the section is on screen, so you always come back
  // to it mid-flow rather than to a frozen list.
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const push = (row: Row) =>
      setRows((prev) => [...prev, row].slice(-MAX_ROWS));
    const patch = (id: number, next: Partial<Extract<Row, { kind: "prompt" }>>) =>
      setRows((prev) =>
        prev.map((r) => (r.id === id && r.kind === "prompt" ? { ...r, ...next } : r)),
      );

    const drawAmbient = () => {
      if (bag.current.at >= bag.current.items.length) {
        bag.current = { items: shuffled(AMBIENT), at: 0 };
      }
      return bag.current.items[bag.current.at++];
    };

    const pushAmbient = () => {
      const event = drawAmbient();
      push({
        id: (nextId.current += 1),
        kind: "result",
        logo: event.logo,
        text: event.text,
        time: clockNow(),
      });
    };

    (async () => {
      // Open with a little history so the panel is already alive.
      if (rowsEmpty.current) {
        for (let i = 0; i < 4; i++) {
          pushAmbient();
          await wait(reduced ? 120 : 160 + Math.random() * 220);
          if (stopped) return;
        }
        rowsEmpty.current = false;
      }

      let untilTyping = AMBIENT_RUN();

      while (!stopped) {
        // Work keeps landing on its own between the typed turns.
        while (untilTyping > 0 && !stopped) {
          pushAmbient();
          untilTyping -= 1;
          await wait(reduced ? 300 : 1100 + Math.random() * 2600);
          if (stopped) return;
        }
        untilTyping = AMBIENT_RUN();

        const turn = TURNS[turnAt.current % TURNS.length];
        turnAt.current += 1;

        const promptId = (nextId.current += 1);
        push({
          id: promptId,
          kind: "prompt",
          text: turn.prompt,
          typed: reduced ? turn.prompt : "",
          state: reduced ? "working" : "typing",
        });

        if (!reduced) {
          // Let the box finish sliding in before the caret starts moving.
          await wait(420);
          if (stopped) return;
          for (let i = 1; i <= turn.prompt.length; i++) {
            await wait(16 + Math.random() * 42);
            if (stopped) return;
            patch(promptId, { typed: turn.prompt.slice(0, i) });
          }
          // Hold the finished sentence before anything responds to it.
          await wait(600);
          if (stopped) return;
          patch(promptId, { state: "working" });
        }

        await wait(reduced ? 300 : 900 + Math.random() * 900);
        if (stopped) return;

        for (const result of turn.results) {
          push({
            id: (nextId.current += 1),
            kind: "result",
            logo: result.logo,
            text: result.text,
            time: clockNow(),
          });
          // Uneven gaps so it reads as work landing, not a timed carousel.
          await wait(reduced ? 250 : 420 + Math.random() * 1000);
          if (stopped) return;
        }

        patch(promptId, { state: "done" });
        await wait(reduced ? 600 : 1500 + Math.random() * 2600);
        if (stopped) return;
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, reduced]);

  return (
    <section ref={section} className="relative overflow-visible bg-background py-20 sm:py-28 lg:overflow-clip">
      <div aria-hidden className="section-dots" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[140px] bottom-[-220px] h-[480px] w-[480px] rounded-full bg-primary/15 blur-[70px]"
      />
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono-label text-[11px] text-primary">
            <span className="dash-live-dot inline-block h-2 w-2 rounded-full bg-[hsl(147_66%_39%)] shadow-[0_0_0_4px_hsl(147_66%_39%/0.18)]" />
            Live across client systems
          </p>
          <h2 className="text-[1.75rem] sm:text-[2.5rem]">A live view of what running looks like.</h2>
          <p className="mt-4 max-w-[520px] text-[17px] text-muted-foreground">
            Every line is a task happening in the background — work nobody on a
            team had to touch. A composite of a typical morning across the
            systems we run.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <Stat key={s.label} stat={s} run={seen} activeRef={activeRef} />
            ))}
          </div>
        </div>

        <div className="feed-stage relative h-[440px] overflow-clip">
          <ul className="absolute inset-x-0 bottom-0 m-0 flex list-none flex-col justify-end gap-2 p-0">
            <AnimatePresence initial={false}>
              {rows.map((row) => (
                <motion.li
                  key={row.id}
                  layout
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_SOFT }}
                >
                  {row.kind === "prompt" ? <PromptRow row={row} /> : <ResultRow row={row} />}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </section>
  );
}
