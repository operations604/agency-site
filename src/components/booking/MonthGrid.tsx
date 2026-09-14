import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EASE } from "../../lib/animations";
import {
  compareDayKeys,
  dayKeyNoonUtc,
  dayKeyWeekday,
  formatDayLong,
  formatMonthYear,
  makeDayKey,
  parseDayKey,
  shiftDayKey,
} from "../../lib/tz";
import type { DayCell, DaySlots } from "./types";

// Day keys are already calendar dates in the display timezone, so every label
// built from one is formatted in UTC off a noon anchor. Formatting them in the
// display zone instead would shift the date for anyone east of UTC+12.
const KEY_ZONE = "UTC";

const WEEK_LENGTH = 7;
const VISIBLE_WEEKS = 6; // fixed, so the grid never changes height mid-month

function monthStart(key: string): string {
  const { year, month } = parseDayKey(key);
  return makeDayKey(year, month, 1);
}

function addMonths(key: string, count: number): string {
  const { year, month, day } = parseDayKey(key);
  const first = new Date(Date.UTC(year, month - 1 + count, 1));
  const y = first.getUTCFullYear();
  const m = first.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return makeDayKey(y, m, Math.min(day, lastDay));
}

function clampKey(key: string, min: string, max: string): string {
  if (compareDayKeys(key, min) < 0) return min;
  if (compareDayKeys(key, max) > 0) return max;
  return key;
}

function buildGrid(viewKey: string): string[] {
  const first = monthStart(viewKey);
  const start = shiftDayKey(first, -dayKeyWeekday(first));
  return Array.from({ length: WEEK_LENGTH * VISIBLE_WEEKS }, (_, i) =>
    shiftDayKey(start, i),
  );
}

function weekdayNames(locale: string): { short: string; long: string }[] {
  // 2024-01-07 was a Sunday; walk a known week to get localised names.
  const shortFmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const longFmt = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
  return Array.from({ length: WEEK_LENGTH }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 7 + i));
    return { short: shortFmt.format(d), long: longFmt.format(d) };
  });
}

type Props = {
  locale: string;
  byDay: DaySlots;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  todayKey: string;
  minKey: string;
  maxKey: string;
  /** Dim the numbers while a fresh availability request is in flight. */
  refreshing: boolean;
};

export default function MonthGrid({
  locale,
  byDay,
  selectedKey,
  onSelect,
  todayKey,
  minKey,
  maxKey,
  refreshing,
}: Props) {
  const reduce = useReducedMotion();
  const labelId = useId();
  const [activeKey, setActiveKey] = useState(selectedKey ?? todayKey);
  const [viewKey, setViewKey] = useState(monthStart(selectedKey ?? todayKey));
  // Focus follows the roving tabindex only when the keyboard moved it, never
  // when a click or an outside jump did.
  const focusNext = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  // An outside change (the "jump to next available day" action) re-homes the
  // active cell and pulls its month into view.
  useEffect(() => {
    if (!selectedKey) return;
    // If the grid already holds focus, carry it to the new active cell —
    // otherwise the focused cell and the only tabbable cell drift apart.
    const active = document.activeElement;
    if (active instanceof HTMLElement && gridRef.current?.contains(active)) {
      focusNext.current = true;
    }
    setActiveKey(selectedKey);
    setViewKey(monthStart(selectedKey));
  }, [selectedKey]);

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const cell = gridRef.current?.querySelector<HTMLElement>(
      `[data-day="${activeKey}"]`,
    );
    cell?.focus();
  }, [activeKey]);

  const move = useCallback(
    (next: string) => {
      const clamped = clampKey(next, minKey, maxKey);
      focusNext.current = true;
      setActiveKey(clamped);
      setViewKey(monthStart(clamped));
    },
    [minKey, maxKey],
  );

  const cells: DayCell[] = useMemo(() => {
    const { month } = parseDayKey(monthStart(viewKey));
    return buildGrid(viewKey).map((key) => ({
      key,
      dayOfMonth: parseDayKey(key).day,
      inMonth: parseDayKey(key).month === month,
      isToday: key === todayKey,
      inWindow:
        compareDayKeys(key, minKey) >= 0 && compareDayKeys(key, maxKey) <= 0,
      slotCount: byDay.get(key)?.length ?? 0,
    }));
  }, [viewKey, byDay, todayKey, minKey, maxKey]);

  const rows = useMemo(
    () =>
      Array.from({ length: VISIBLE_WEEKS }, (_, r) =>
        cells.slice(r * WEEK_LENGTH, (r + 1) * WEEK_LENGTH),
      ),
    [cells],
  );

  const days = useMemo(() => weekdayNames(locale), [locale]);
  const monthLabel = formatMonthYear(
    dayKeyNoonUtc(monthStart(viewKey)),
    KEY_ZONE,
    locale,
  );

  const canPrev = compareDayKeys(addMonths(monthStart(viewKey), -1), monthStart(minKey)) >= 0;
  const canNext = compareDayKeys(monthStart(addMonths(viewKey, 1)), monthStart(maxKey)) <= 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    const weekday = dayKeyWeekday(activeKey);
    switch (e.key) {
      case "ArrowLeft":
        move(shiftDayKey(activeKey, -1));
        break;
      case "ArrowRight":
        move(shiftDayKey(activeKey, 1));
        break;
      case "ArrowUp":
        move(shiftDayKey(activeKey, -WEEK_LENGTH));
        break;
      case "ArrowDown":
        move(shiftDayKey(activeKey, WEEK_LENGTH));
        break;
      case "Home":
        move(shiftDayKey(activeKey, -weekday));
        break;
      case "End":
        move(shiftDayKey(activeKey, WEEK_LENGTH - 1 - weekday));
        break;
      case "PageUp":
        move(addMonths(activeKey, e.shiftKey ? -12 : -1));
        break;
      case "PageDown":
        move(addMonths(activeKey, e.shiftKey ? 12 : 1));
        break;
      case "Enter":
      case " ":
        if (compareDayKeys(activeKey, minKey) >= 0 &&
            compareDayKeys(activeKey, maxKey) <= 0) {
          onSelect(activeKey);
        }
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const stepMonth = (count: number) => {
    const next = clampKey(addMonths(monthStart(viewKey), count), minKey, maxKey);
    setViewKey(monthStart(next));
    setActiveKey(clampKey(next, minKey, maxKey));
  };

  // Every set defines `exit`. AnimatePresence propagates that label into this
  // subtree when the step changes, and a variant child that cannot resolve it
  // stalls the whole `mode="wait"` transition.
  const body: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.028 },
    },
    exit: {},
  };
  const row: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.01 } },
    exit: {},
  };
  const cellVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.18 : 0.24, ease: EASE },
    },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h4 id={labelId} className="text-[18px] font-semibold">
          {monthLabel}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            disabled={!canPrev}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            disabled={!canNext}
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        className="mt-4 w-full table-fixed border-separate border-spacing-y-1"
      >
        <thead>
          <tr>
            {days.map((d) => (
              <th
                key={d.long}
                scope="col"
                abbr={d.long}
                className="font-mono-label pb-2 text-center text-[11px] font-medium text-muted-foreground"
              >
                <span aria-hidden>{d.short}</span>
                <span className="sr-only">{d.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          key={monthStart(viewKey)}
          variants={body}
          initial="hidden"
          animate="visible"
        >
          {rows.map((week, r) => (
            <motion.tr key={`${monthStart(viewKey)}-${r}`} variants={row}>
              {week.map((cell) => {
                const open = cell.slotCount > 0;
                const selectable = cell.inWindow;
                const isSelected = cell.key === selectedKey;
                const label = `${formatDayLong(dayKeyNoonUtc(cell.key), KEY_ZONE, locale)}, ${
                  !selectable
                    ? "unavailable"
                    : open
                      ? `${cell.slotCount} ${cell.slotCount === 1 ? "time" : "times"} available`
                      : "no times available"
                }`;
                return (
                  <motion.td
                    key={cell.key}
                    variants={cellVariants}
                    role="gridcell"
                    data-day={cell.key}
                    tabIndex={cell.key === activeKey ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={selectable ? undefined : true}
                    aria-label={label}
                    onClick={() => {
                      if (!selectable) return;
                      setActiveKey(cell.key);
                      onSelect(cell.key);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      e.stopPropagation();
                      if (!selectable) return;
                      onSelect(cell.key);
                    }}
                    className={`group p-0 text-center align-middle focus:outline-none ${
                      selectable ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={[
                        "mx-auto grid h-11 w-11 place-items-center rounded-full font-mono text-[14px] tabular-nums transition-colors duration-200 booking-day",
                        "group-focus:ring-2 group-focus:ring-ring group-focus:ring-offset-2 group-focus:ring-offset-background",
                        isSelected
                          ? "bg-primary font-semibold text-primary-foreground"
                          : !selectable
                            ? cell.inMonth
                              ? "text-muted-foreground/45"
                              : "text-muted-foreground/25"
                            : open
                              ? "border border-border/80 bg-transparent font-medium text-foreground group-hover:border-primary/45 group-hover:text-primary"
                              : "text-muted-foreground/70",
                        refreshing && !isSelected ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      {cell.dayOfMonth}
                    </span>
                    {cell.isToday && !isSelected && (
                      <span
                        aria-hidden
                        className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-primary"
                      />
                    )}
                  </motion.td>
                );
              })}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
