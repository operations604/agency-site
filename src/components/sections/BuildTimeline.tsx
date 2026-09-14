import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
// Softer than the site-wide EASE (expo-out), which is ~90% done a third of the way in.
// This ramps in gradually and settles without snapping.
const GLIDE = [0.4, 0, 0.2, 1] as const;
import { STEPS } from "../../content/timeline";

// Each icon's width as a fraction of --u, taken from its size in the mockup.
// The source art has different proportions per icon, so one shared box would squash them.
const ICONS = [
  { src: "/timeline/phone.png", w: 0.0775 },
  { src: "/timeline/search.png", w: 0.072 },
  { src: "/timeline/clipboard.png", w: 0.068 },
  { src: "/timeline/wrench.png", w: 0.0753 },
  { src: "/timeline/puzzle.png", w: 0.1001 },
  { src: "/timeline/rocket.png", w: 0.0666 },
] as const;

const stepIn = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.85, ease: GLIDE } },
};

export default function BuildTimeline() {
  const list = useRef<HTMLOListElement>(null);
  const reduced = !!useReducedMotion();
  const [railBox, setRailBox] = useState({ top: 24, bottom: 24 });

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const sync = () => {
      const nums = el.querySelectorAll(".hiw-num");
      const first = nums[0]?.getBoundingClientRect();
      const last = nums[nums.length - 1]?.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      if (!first || !last) return;
      setRailBox({
        top: first.top + first.height / 2 - box.top,
        bottom: box.bottom - (last.top + last.height / 2),
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="hiw relative bg-background">
      <div aria-hidden className="hiw-glow" />
      <div aria-hidden className="section-dots" />

      <div className="hiw-stage">
        <div className="hiw-frame">
          <motion.div
            className="hiw-copy"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -22 }}
            whileInView={{ opacity: 1, x: 0, transition: { duration: 0.9, ease: GLIDE } }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="hiw-kicker font-mono-label">How it works</p>
            <h2 className="hiw-title">
              From first call
              <br />
              to live system.
            </h2>
            <p className="hiw-lead">
              Two conversations, a fixed price,
              <br />
              then we build on your real data.
            </p>
          </motion.div>

          <div className="hiw-panel">
            <motion.ol
              ref={list}
              className="hiw-list"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.13, delayChildren: 0.12 } },
              }}
            >
              <span
                aria-hidden
                className="hiw-rail"
                style={{ top: railBox.top, bottom: railBox.bottom }}
              >
                <motion.i
                  initial={{ scaleY: reduced ? 1 : 0 }}
                  whileInView={{
                    scaleY: 1,
                    transition: { duration: 1.5, ease: GLIDE, delay: 0.05 },
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                  style={{ transformOrigin: "50% 0%" }}
                />
              </span>

              {STEPS.map((step, i) => {
                const live = i === STEPS.length - 1;
                return (
                  <motion.li
                    key={step.title}
                    className={`hiw-step${live ? " hiw-live" : ""}`}
                    variants={reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : stepIn}
                  >
                    {live && <span aria-hidden className="hiw-live-fill" />}
                    <span className={`hiw-num${live ? " hiw-num-live" : ""}`}>{i + 1}</span>
                    <div className="hiw-copy-block">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                    <img
                      className="hiw-ico"
                      src={ICONS[i].src}
                      alt=""
                      style={{ ["--iw" as string]: ICONS[i].w }}
                    />
                  </motion.li>
                );
              })}
            </motion.ol>

            <motion.div
              className="hiw-robot"
              aria-hidden
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 22 }}
              whileInView={{
                opacity: 1,
                x: 0,
                transition: { duration: 0.9, ease: GLIDE, delay: 0.7 },
              }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <img src="/timeline/robot.png" alt="" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
