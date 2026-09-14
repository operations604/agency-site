import { POSE_SRC, type DemoStage } from "../../lib/demo-stage";

type Pose = Extract<DemoStage, "overview" | "complete">;

type Props = {
  pose?: Pose;
  className?: string;
};

/** Scheduler companion. Decorative — the calendar headings carry the name. */
export default function BookingRobot({ pose = "overview", className = "" }: Props) {
  return (
    <img
      src={POSE_SRC[pose]}
      alt=""
      draggable={false}
      className={`pointer-events-none select-none object-contain ${className}`}
    />
  );
}
