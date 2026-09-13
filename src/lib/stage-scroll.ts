import { motionValue } from "framer-motion";

/** Raw 0–1 progress of the pinned handoff stage. HoneycombStrip reads this
 *  so the hex entrance starts when that section ends, not on a random IO. */
export const stageScroll = motionValue(0);
