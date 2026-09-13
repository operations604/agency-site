import type { Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, staggerChildren: 0.06 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
