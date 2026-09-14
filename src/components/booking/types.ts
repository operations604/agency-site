import type { Slot } from "../../lib/booking-api";

export type BookingStep = 1 | 2 | 3 | 4;

export const STEP_LABELS: Record<BookingStep, string> = {
  1: "Time",
  2: "Who",
  3: "Problem",
  4: "Confirmed",
};

/** Name and email on step 2; the typed problem is optional. */
export type LeadForm = {
  name: string;
  email: string;
  painPoint: string;
};

export const EMPTY_LEAD: LeadForm = {
  name: "",
  email: "",
  painPoint: "",
};

export type DaySlots = Map<string, Slot[]>;

export type DayCell = {
  /** YYYY-MM-DD in the display timezone. */
  key: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  /** Inside the booking window and not in the past. */
  inWindow: boolean;
  slotCount: number;
};
