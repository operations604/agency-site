import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { goToBooking } from "../../lib/goto-booking";

// Opens the booking popup. Visual design stays here; click behaviour lives
// in goToBooking so nav, hero, pricing, and footer buttons match.

type Props = {
  children: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
};

export default function BookCallButton({
  children,
  variant = "solid",
  className = "",
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const look =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_6px_24px_-4px_hsl(222_84%_53%/0.45)]"
      : "border border-border bg-transparent text-foreground hover:border-foreground/40 hover:bg-white";
  const tapScale = variant === "solid" ? 0.97 : 0.98;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`${base} ${look} ${className}`}
      aria-haspopup="dialog"
      onClick={goToBooking}
    >
      {children}
    </motion.button>
  );
}
