import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

// drift = how far (px) the layer travels over the first RANGE px of scroll.
// Far layers drift less, near layers drift more. That difference is the depth.
const BLOBS = [
  { color: "245 100% 68%", size: 520, top: "-18%", left: "4%", delay: 0, dur: 38, drift: -150 },
  { color: "217 91% 56%", size: 460, top: "-4%", left: "52%", delay: 6, dur: 46, drift: -240 },
  { color: "263 72% 64%", size: 400, top: "28%", left: "22%", delay: 3, dur: 54, drift: -110 },
];

const EXTRA = [
  { color: "191 90% 52%", size: 380, top: "-8%", left: "68%", delay: 2, dur: 50, drift: -200 },
  { color: "245 100% 68%", size: 300, top: "42%", left: "78%", delay: 8, dur: 44, drift: -80 },
];

const RANGE = [0, 640];

export default function MeshField({
  extend,
}: {
  extend?: boolean;
}) {
  const reduced = !!useReducedMotion();
  const { scrollY } = useScroll();
  const yAurora = useTransform(scrollY, RANGE, [0, reduced ? 0 : -190]);
  const yDots = useTransform(scrollY, RANGE, [0, reduced ? 0 : -60]);
  const blobs = extend ? [...BLOBS, ...EXTRA] : BLOBS;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/*
        Every scroll-driven wrapper here is promoted (will-change). Without it
        a JS-set transform re-rasterizes the hero's layer on each frame; the
        dot grid alone is a full-viewport gradient tile pattern.
      */}
      <motion.div className="absolute inset-0" style={{ y: yAurora, willChange: "transform" }}>
        <div
          className="aurora-band absolute inset-x-[-10%] top-[-24%] h-[70%]"
          style={{
            // Soft-edged gradient instead of a filter blur: same wash, no
            // per-frame filter work while the band drifts.
            background:
              "radial-gradient(ellipse 60% 55% at 30% 50%, hsl(245 100% 68% / 0.12), transparent 100%), radial-gradient(ellipse 60% 55% at 72% 50%, hsl(191 90% 52% / 0.11), transparent 100%)",
            animation: "auroraDrift 60s ease-in-out infinite",
          }}
        />
      </motion.div>
      {blobs.map((blob, i) => (
        <ParallaxBlob key={i} blob={blob} scrollY={scrollY} reduced={reduced} />
      ))}
      <motion.div
        className="absolute inset-0 dot-grid opacity-60"
        style={{ y: yDots, willChange: "transform" }}
      />
      <div className="film-grain" />
    </div>
  );
}

function ParallaxBlob({
  blob,
  scrollY,
  reduced,
}: {
  blob: (typeof BLOBS)[number];
  scrollY: MotionValue<number>;
  reduced: boolean;
}) {
  const y = useTransform(scrollY, RANGE, [0, reduced ? 0 : blob.drift]);

  return (
    <motion.div
      className="absolute"
      style={{
        width: blob.size,
        height: blob.size,
        top: blob.top,
        left: blob.left,
        y,
        willChange: "transform",
      }}
    >
      {/* A long gradient falloff reads like a 70px blur but is a plain paint. */}
      <div
        className="mesh-blob h-full w-full rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(${blob.color} / 0.34) 0%, hsl(${blob.color} / 0.18) 28%, hsl(${blob.color} / 0.06) 52%, transparent 72%)`,
          opacity: 0.6,
          animation: `meshFloat ${blob.dur}s ease-in-out ${blob.delay}s infinite`,
        }}
      />
    </motion.div>
  );
}
