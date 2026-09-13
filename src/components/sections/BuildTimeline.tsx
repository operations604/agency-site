import { useEffect, useRef, useState } from "react";
import { STEPS } from "../../content/timeline";

const ICONS = [
  "/timeline/phone.png",
  "/timeline/search.png",
  "/timeline/clipboard.png",
  "/timeline/wrench.png",
  "/timeline/puzzle.png",
  "/timeline/rocket.png",
] as const;

export default function BuildTimeline() {
  const section = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={section}
      className={`hiw relative bg-background py-20 sm:py-28${on ? " hiw-in" : ""}`}
    >
      <div aria-hidden className="hiw-glow" />

      <div className="relative mx-auto grid max-w-[1120px] items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16 xl:gap-20">
        <div className="lg:pt-2">
          <p className="hiw-kicker mb-2 font-mono-label text-[11px] text-primary">How it works</p>
          <h2 className="hiw-title max-w-[440px] text-[1.85rem] leading-[1.08] sm:text-[2.55rem]">
            From first call to live system.
          </h2>
          <p className="hiw-lead mt-4 max-w-[420px] text-[17px] leading-[1.55] text-muted-foreground">
            Two conversations, a fixed price, then we build on your real data.
          </p>
        </div>

        <div className="hiw-panel relative">
          <ol className="hiw-list relative">
            <span aria-hidden className="hiw-rail">
              <i />
            </span>
            {STEPS.map((step, i) => {
              const live = i === STEPS.length - 1;
              return (
                <li
                  key={step.title}
                  className={`hiw-step relative grid grid-cols-[36px_minmax(0,1fr)_96px] items-center gap-x-5 py-[18px] sm:grid-cols-[36px_minmax(0,1fr)_104px]${
                    live ? " hiw-live" : ""
                  }`}
                  style={{ ["--hiw-d" as string]: `${250 + i * 100}ms` }}
                >
                  <span
                    className={`hiw-num relative z-[1] grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold ${
                      live
                        ? "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(222_84%_53%/0.35)]"
                        : "bg-white text-primary shadow-[0_1px_3px_#151a2814,inset_0_0_0_1.5px_hsl(220_16%_88%)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold tracking-tight text-foreground sm:text-[18px]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-[1.5] text-muted-foreground">{step.desc}</p>
                  </div>
                  <div className="hiw-ico-cell grid h-[80px] w-[80px] place-items-center justify-self-end sm:h-[88px] sm:w-[88px]">
                    <img src={ICONS[i]} alt="" className="hiw-ico max-h-full max-w-full object-contain" />
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="hiw-robot" aria-hidden>
            <img src="/timeline/robot.png" alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}
