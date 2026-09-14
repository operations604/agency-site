import type { Slot } from "../../lib/booking-api";

export type BookingStep = 1 | 2 | 3;

export const STEP_LABELS: Record<BookingStep, string> = {
  1: "Pick a time",
  2: "Your details",
  3: "Confirmed",
};

/**
 * Form state. Four required fields, and no more — every extra field
 * costs bookings. Optional extras used to live here; they do not anymore.
 */
export type LeadForm = {
  name: string;
  email: string;
  company: string;
  painPoint: string;
};

export const EMPTY_LEAD: LeadForm = {
  name: "",
  email: "",
  company: "",
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
