import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOOKING_WINDOW_DAYS,
  bookingApi,
  type AvailabilityResult,
  type Slot,
} from "../../lib/booking-api";
import { compareDayKeys, dayKey } from "../../lib/tz";
import type { DaySlots } from "./types";

export type AvailabilityStatus = "loading" | "ready" | "error";

export type Availability = {
  status: AvailabilityStatus;
  result: AvailabilityResult | null;
  error: string | null;
  /** Slots grouped by calendar day *in the display timezone*. */
  byDay: DaySlots;
  /** Every day with at least one open slot, ascending. */
  openDayKeys: string[];
  windowDays: number;
  reload: () => void;
  /** Remove a slot locally after the server says it was taken. */
  dropSlot: (startsAt: string) => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function useAvailability(timezone: string): Availability {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [status, setStatus] = useState<AvailabilityStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  // Only the newest request may write state; a timezone change mid-flight
  // must not be overwritten by the reply to the previous one.
  const runRef = useRef(0);

  useEffect(() => {
    const run = ++runRef.current;
    setStatus("loading");
    setError(null);

    const from = new Date();
    const to = new Date(from.getTime() + BOOKING_WINDOW_DAYS * DAY_MS);

    bookingApi
      .getAvailability({
        from: from.toISOString(),
        to: to.toISOString(),
        timezone,
      })
      .then((next) => {
        if (run !== runRef.current) return;
        setResult(next);
        setStatus("ready");
      })
      .catch(() => {
        if (run !== runRef.current) return;
        // Availability has no typed failure in the contract, so anything that
        // lands here is a transport problem: offer a retry, say nothing else.
        setError("We could not load the calendar.");
        setStatus("error");
      });
  }, [timezone, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const dropSlot = useCallback((startsAt: string) => {
    setResult((prev) =>
      prev
        ? { ...prev, slots: prev.slots.filter((s) => s.startsAt !== startsAt) }
        : prev,
    );
  }, []);

  // Slots are UTC, so a timezone change only re-groups them — the previous
  // result stays on screen while the refetch is in flight.
  const { byDay, openDayKeys } = useMemo(() => {
    const map: DaySlots = new Map();
    for (const slot of result?.slots ?? []) {
      const key = dayKey(Date.parse(slot.startsAt), timezone);
      const list = map.get(key);
      if (list) list.push(slot);
      else map.set(key, [slot]);
    }
    for (const list of map.values()) {
      list.sort((a: Slot, b: Slot) => (a.startsAt < b.startsAt ? -1 : 1));
    }
    return {
      byDay: map,
      openDayKeys: Array.from(map.keys()).sort(compareDayKeys),
    };
  }, [result, timezone]);

  return {
    status,
    result,
    error,
    byDay,
    openDayKeys,
    windowDays: BOOKING_WINDOW_DAYS,
    reload,
    dropSlot,
  };
}
