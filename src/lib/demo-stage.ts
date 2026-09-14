export type DemoStage = "overview" | "pipeline" | "dispatch" | "complete";

export const STAGE_ORDER: DemoStage[] = [
  "overview",
  "pipeline",
  "dispatch",
  "complete",
];

export const STAGE_MS: Record<DemoStage, number> = {
  overview: 4000,
  pipeline: 5200,
  dispatch: 4500,
  complete: 3800,
};

export const STATUS_REVEAL_MS = 200;
export const POSE_CROSSFADE_S = 0.2;
export const ENTRANCE_MS = 450;

export const POSE_SRC: Record<DemoStage, string> = {
  overview: "/robots/robot-overview.png",
  pipeline: "/robots/robot-pipeline.png",
  dispatch: "/robots/robot-dispatch.png",
  complete: "/robots/robot-complete.png",
};

/** Per-pose seat calibration. Images share a hip origin; these nudge leftover margin. */
export const POSE_SEAT: Record<DemoStage, { x: string; y: string; scale: number }> = {
  overview: { x: "0%", y: "0%", scale: 1 },
  pipeline: { x: "1%", y: "1%", scale: 1 },
  dispatch: { x: "-2%", y: "0.5%", scale: 1 },
  complete: { x: "2%", y: "2%", scale: 1 },
};

export const STATUS_ROWS: {
  stage: DemoStage;
  label: string;
  detail: string;
}[] = [
  {
    stage: "overview",
    label: "Lead captured",
    detail: "Sarah Kim · Google LSA",
  },
  {
    stage: "pipeline",
    label: "Moved through pipeline",
    detail: "Quoted, then booked",
  },
  {
    stage: "dispatch",
    label: "Crew dispatched",
    detail: "Omar R. · Downtown 2:45p",
  },
  {
    stage: "complete",
    label: "Running unattended",
    detail: "Front desk reply sent",
  },
];

export const PIPE_BEATS_MS = [0, 1700, 3400] as const;

export function stageToPage(stage: DemoStage) {
  if (stage === "pipeline") return "Pipeline" as const;
  if (stage === "dispatch") return "Dispatch" as const;
  return "Overview" as const;
}

export function nextStage(stage: DemoStage): DemoStage {
  const i = STAGE_ORDER.indexOf(stage);
  return STAGE_ORDER[(i + 1) % STAGE_ORDER.length];
}
