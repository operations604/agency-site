import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE } from "../../lib/animations";
import type { Slot } from "../../lib/booking-api";
import { dayKeyNoonUtc, formatDayLong, formatTime } from "../../lib/tz";

const KEY_ZONE = "UTC";

type Props = {
  dayKey: string | null;
  slots: Slot[];
  selectedStartsAt: string | null;
  onSelect: (slot: Slot) => void;
  timezone: string;
  locale: string;
  loading: boolean;
  slotMinutes: number;
  nextOpenKey: string | null;
  onJump: (key: string) => void;
  /** Bumped when a jump changed the day, so focus follows into the times. */
  focusFirstNonce: number;
};

function SkeletonPills() {
  return (
    <div className="mt-4 grid gap-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function TimeList({
  dayKey,
  slots,
  selectedStartsAt,
  onSelect,
  timezone,
  locale,
  loading,
  slotMinutes,
  nextOpenKey,
  onJump,
  focusFirstNonce,
}: Props) {
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);

  // The jump button unmounts with the list it sits in, so without this the
  // keyboard path dead-ends on <body>.
  useEffect(() => {
    if (focusFirstNonce === 0) return;
    listRef.current?.querySelector("button")?.focus();
  }, [focusFirstNonce]);

  // `exit` is required here: see the note in MonthGrid.
  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.022 } },
    exit: {},
  };
  const pill: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.18 : 0.24, ease: EASE },
    },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  };

  if (!dayKey) {
    return (
      <p className="mt-4 text-[15px] text-muted-foreground">
        Pick a day to see open times.
      </p>
    );
  }

  const dayLabel = formatDayLong(dayKeyNoonUtc(dayKey), KEY_ZONE, locale);

  return (
    <div>
      <h4 className="text-[17px] font-semibold">{dayLabel}</h4>
      <p className="font-mono-label mt-1 text-[11px] text-muted-foreground">
        {slotMinutes} min call
      </p>

      {loading ? (
        <SkeletonPills />
      ) : slots.length === 0 ? (
        <div className="mt-4">
          <p className="text-[15px] text-muted-foreground">
            Nothing open on this day.
          </p>
          {nextOpenKey && (
            <button
              type="button"
              onClick={() => onJump(nextOpenKey)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-[15px] font-medium text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Jump to{" "}
              {formatDayLong(dayKeyNoonUtc(nextOpenKey), KEY_ZONE, locale)}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      ) : (
        <motion.ul
          ref={listRef}
          key={dayKey}
          variants={list}
          initial="hidden"
          animate="visible"
          // Tall days scroll inside the pane rather than stretching it.
          className="mt-4 grid gap-2 min-[900px]:max-h-[336px] min-[900px]:overflow-y-auto min-[900px]:pr-1"
        >
          {slots.map((slot) => {
            const selected = slot.startsAt === selectedStartsAt;
            const start = Date.parse(slot.startsAt);
            return (
              <motion.li key={slot.startsAt} variants={pill}>
                <button
                  type="button"
                  onClick={() => onSelect(slot)}
                  aria-pressed={selected}
                  className={`w-full rounded-xl border px-4 py-2.5 text-left font-mono text-[14px] tabular-nums transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    selected
                      ? "border-primary bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-white/80 text-foreground hover:border-primary/40 hover:bg-white"
                  }`}
                >
                  {formatTime(start, timezone, locale)}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
