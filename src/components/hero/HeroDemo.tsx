import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIPE_BEATS_MS,
  POSE_SRC,
  STAGE_MS,
  STAGE_ORDER,
  STATUS_REVEAL_MS,
  nextStage,
  type DemoStage,
} from "../../lib/demo-stage";
import MacBoot from "./MacBoot";
import RobotMascot from "./RobotMascot";
import AutomationStatus from "./AutomationStatus";

type Props = {
  ready: boolean;
  reduced: boolean;
};

export default function HeroDemo({ ready, reduced }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dashReady, setDashReady] = useState(reduced);
  const [assetsReady, setAssetsReady] = useState(reduced);
  const [stage, setStage] = useState<DemoStage>(reduced ? "complete" : "overview");
  const [statusReady, setStatusReady] = useState(reduced);
  const [pipeStep, setPipeStep] = useState(reduced ? 2 : 0);
  const [onscreen, setOnscreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const remainingRef = useRef(STAGE_MS.overview);
  const startedAtRef = useRef(0);
  const stageElapsedRef = useRef(0);

  const onApp = useCallback(() => setDashReady(true), []);
  const frozen = !onscreen || !pageVisible;
  const playing = dashReady && assetsReady && !reduced && !frozen;

  useEffect(() => {
    if (reduced) {
      setAssetsReady(true);
      return;
    }
    let n = 0;
    STAGE_ORDER.forEach((pose) => {
      const img = new Image();
      const done = () => {
        n += 1;
        if (n >= STAGE_ORDER.length) setAssetsReady(true);
      };
      img.onload = done;
      img.onerror = done;
      img.src = POSE_SRC[pose];
    });
  }, [reduced]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnscreen(entry.isIntersecting),
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (reduced || !playing) return;
    let advanced = false;
    startedAtRef.current = performance.now();
    const tick = window.setTimeout(() => {
      advanced = true;
      const next = nextStage(stage);
      remainingRef.current = STAGE_MS[next];
      stageElapsedRef.current = 0;
      if (next === "overview" || next === "pipeline") setPipeStep(0);
      setStage(next);
    }, remainingRef.current);
    return () => {
      window.clearTimeout(tick);
      if (advanced) return;
      const used = performance.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - used);
      stageElapsedRef.current += used;
    };
  }, [playing, stage, reduced]);

  useEffect(() => {
    if (reduced) {
      setStatusReady(true);
      return;
    }
    setStatusReady(false);
  }, [stage, reduced]);

  useEffect(() => {
    if (statusReady || reduced) return;
    if (frozen || !dashReady || !assetsReady) return;
    const t = window.setTimeout(() => setStatusReady(true), STATUS_REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [stage, frozen, dashReady, assetsReady, statusReady, reduced]);

  useEffect(() => {
    if (stage !== "pipeline" || reduced) return;
    if (!playing) return;
    const timers = PIPE_BEATS_MS.slice(1).map((at, i) => {
      const wait = Math.max(0, at - stageElapsedRef.current);
      return window.setTimeout(() => setPipeStep(i + 1), wait);
    });
    return () => timers.forEach(clearTimeout);
  }, [stage, playing, reduced]);

  const mascotOn = dashReady && assetsReady;

  return (
    <div
      ref={rootRef}
      className="hero-demo relative min-w-0 w-full"
      style={{ ["--mascot" as string]: "clamp(100px, 15%, 180px)" }}
    >
      <MacBoot
        ready={ready}
        reduced={reduced}
        stage={stage}
        paused={frozen}
        statusReady={statusReady}
        pipeStep={pipeStep}
        onApp={onApp}
      />

      {mascotOn && (
        <>
          <div
            className="pointer-events-none absolute z-20 w-[min(168px,calc(100%-var(--mascot)-12px))]"
            style={{
              right: "calc(var(--mascot) - 8px)",
              bottom: "7%",
            }}
          >
            <AutomationStatus
              stage={stage}
              statusReady={statusReady}
              reduced={reduced}
            />
          </div>
          <div className="pointer-events-none absolute right-0 bottom-0 z-20 w-[var(--mascot)] translate-y-[14%]">
            <RobotMascot stage={stage} reduced={reduced} visible={mascotOn} />
          </div>
        </>
      )}
    </div>
  );
}
