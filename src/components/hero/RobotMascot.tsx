import { motion } from "framer-motion";
import { EASE } from "../../lib/animations";
import {
  POSE_CROSSFADE_S,
  POSE_SEAT,
  POSE_SRC,
  type DemoStage,
} from "../../lib/demo-stage";

const STAGES: DemoStage[] = ["overview", "pipeline", "dispatch", "complete"];

type Props = {
  stage: DemoStage;
  reduced: boolean;
  visible: boolean;
  className?: string;
};

export default function RobotMascot({
  stage,
  reduced,
  visible,
  className = "",
}: Props) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none relative aspect-square w-full ${className}`}
      initial={reduced || !visible ? false : { opacity: 0, transform: "translateY(12px)" }}
      animate={
        visible
          ? { opacity: 1, transform: "translateY(0px)" }
          : { opacity: 0, transform: reduced ? "translateY(0px)" : "translateY(12px)" }
      }
      transition={{
        duration: reduced ? 0 : 0.45,
        ease: EASE,
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {STAGES.map((pose) => {
        const seat = POSE_SEAT[pose];
        const on = pose === stage;
        return (
          <motion.img
            key={pose}
            src={POSE_SRC[pose]}
            alt=""
            draggable={false}
            animate={{ opacity: on && visible ? 1 : 0 }}
            transition={{
              duration: reduced ? 0 : POSE_CROSSFADE_S,
              ease: EASE,
            }}
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              transform: `translate(${seat.x}, ${seat.y}) scale(${seat.scale})`,
              willChange: "opacity",
            }}
          />
        );
      })}
    </motion.div>
  );
}
