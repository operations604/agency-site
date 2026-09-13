import { useEffect, useRef, useState } from "react";
import { EVENTS, STATS, type FeedEvent } from "../../content/feed";

function Stat({
  value,
  suffix,
  label,
  run,
}: {
  value: number;
  suffix: string;
  label: string;
  run: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!run || !ref.current) return;
    const el = ref.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = value.toLocaleString();
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 2200);
      el.textContent = Math.round(value * (1 - Math.pow(1 - t, 3))).toLocaleString();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return (
    <div className="hairline rounded-2xl bg-card px-4 py-3.5">
      <div className="font-heading text-[1.9rem] font-semibold leading-none tracking-tight">
        <span ref={ref}>0</span>
        {suffix && <span className="text-primary">{suffix}</span>}
      </div>
      <div className="font-mono-label mt-1.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Event({ e }: { e: FeedEvent }) {
  if (e.kind === "quote") {
    return (
      <li className="rounded-xl bg-foreground px-4 py-3.5 text-[13.5px] leading-[1.5] text-primary-foreground">
        "{e.text}"
        <span className="mt-2 block text-[11.5px] text-[hsl(220_20%_72%)]">— {e.who}</span>
      </li>
    );
  }
  return (
    <li className="hairline grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 text-[13px]">
      <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-[hsl(220_20%_94%)]">
        <img
          src={`/logos/${e.logo}.png`}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="truncate">{e.text}</span>
      <time className="font-mono-label text-[10px] text-muted-foreground">{e.time}</time>
    </li>
  );
}

export default function LiveFeed() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setActive(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={section}
      className="relative overflow-hidden bg-background py-20 sm:py-28"
    >
      <div aria-hidden className="section-dots" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[140px] bottom-[-220px] h-[480px] w-[480px] rounded-full bg-primary/15 blur-[70px]"
        style={{ willChange: "transform" }}
      />
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono-label text-[11px] text-primary">
            <span className="dash-live-dot inline-block h-2 w-2 rounded-full bg-[hsl(147_66%_39%)] shadow-[0_0_0_4px_hsl(147_66%_39%/0.18)]" />
            A Monday across client systems
          </p>
          <h2 className="text-[1.75rem] sm:text-[2.5rem]">This is what running looks like.</h2>
          <p className="mt-4 max-w-[520px] text-[17px] text-muted-foreground">
            Every line is a task nobody on a team had to do. A composite of a
            typical morning, drawn from the systems we run.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <Stat key={s.label} {...s} run={seen} />
            ))}
          </div>
        </div>
        <div
          className={`feed-viewport relative h-[440px] ${active ? "" : "feed-paused"}`}
        >
          <ul className="feed-scroll absolute inset-x-0 top-0 m-0 list-none space-y-2 p-0">
            {EVENTS.map((e, i) => (
              <Event key={i} e={e} />
            ))}
            {EVENTS.map((e, i) => (
              <Event key={`dup-${i}`} e={e} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
