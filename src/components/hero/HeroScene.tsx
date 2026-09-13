import { useEffect, useRef, useState } from "react";
import Hero from "./Hero";
import MeshField from "./MeshField";

// The mesh sky lives here so it can run behind the hero and bleed into the
// next section. Layers inside MeshField move at different scroll speeds, so
// the background is part of the parallax instead of a static backdrop.
export default function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLive(true), 180);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("scene-offscreen", !entry.isIntersecting);
      },
      { threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative${live ? " scene-live" : ""}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -bottom-[45vh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_62%,transparent)]"
      >
        <MeshField extend />
      </div>
      <div className="relative">
        <Hero />
      </div>
    </div>
  );
}
