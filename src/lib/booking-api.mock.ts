// Phase 1's only implementation of BookingApi.
//
// Selected whenever VITE_BOOKING_API_URL is unset. It generates real slots
// from the business rules below, persists bookings to localStorage so a booked
// slot stays gone across reloads, and simulates network latency so the
// loading states in the UI are real rather than theoretical.
//
// Nothing here reaches a server. A booking made against this adapter is not
// saved anywhere but this browser, which is why the confirmation screen checks
// `bookingApiIsMock` before it promises anything.

import type {
  AvailabilityQuery,
  AvailabilityResult,
  BookingApi,
  BookingRequest,
  BookingResult,
  CancelRequest,
  CancelResult,
  Slot,
} from "./booking-api";
import { getZonedParts, zonedTimeToUtc } from "./tz";

// ---- Business rules (confirmed before implementation) --------------------

const BUSINESS_TIMEZONE = "America/New_York";
const OPEN_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
/** Mon–Fri 16:00–21:00. Sat–Sun 09:00–21:00. Last slot must END by close. */
const WEEKDAY_START_MINUTE = 16 * 60;
const WEEKEND_START_MINUTE = 9 * 60;
const WORK_END_MINUTE = 21 * 60;
const SLOT_MINUTES = 30;
const BUFFER_MINUTES = 0;
const MIN_NOTICE_HOURS = 12;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// ---- Persistence ---------------------------------------------------------

const STORAGE_KEY = "applied.booking.mock.v1";

type StoredBooking = {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  meetUrl: string | null;
  manageToken: string;
  createdAt: string;
  name: string;
  email: string;
  status: "confirmed" | "cancelled";
};

function readStore(): StoredBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredBooking[]) : [];
  } catch {
    return [];
  }
}

function writeStore(rows: StoredBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* private mode: the slot just will not persist across reloads */
  }
}

function isHeld(b: StoredBooking): boolean {
  return b.status !== "cancelled";
}

function takenStarts(): Set<string> {
  return new Set(readStore().filter(isHeld).map((b) => b.startsAt));
}

// ---- Forced failures -----------------------------------------------------

/**
 * Every state the UI has to render is reachable from the URL, without editing
 * code:
 *   ?mockfail=slot_taken    — book() reports the slot was just taken
 *   ?mockfail=server_error  — book() reports a server failure
 *   ?mockfail=rate_limited  — book() reports too many attempts
 *   ?mockfail=network       — book() throws, as a transport failure does
 *   ?mockfail=nomeet        — success, but meetUrl is null
 *   ?mockfail=empty_range   — no availability at all in the window
 *   ?mockfail=availability  — getAvailability() throws
 */
type MockFail =
  | "slot_taken"
  | "server_error"
  | "rate_limited"
  | "network"
  | "nomeet"
  | "empty_range"
  | "availability";

const FAIL_MODES: MockFail[] = [
  "slot_taken",
  "server_error",
  "rate_limited",
  "network",
  "nomeet",
  "empty_range",
  "availability",
];

function mockFail(): MockFail | null {
  try {
    const value = new URLSearchParams(window.location.search).get("mockfail");
    return FAIL_MODES.find((m) => m === value) ?? null;
  } catch {
    return null;
  }
}

/** 400–900 ms, so the loading and submitting states are actually exercised. */
function latency(): Promise<void> {
  const ms = 400 + Math.floor(Math.random() * 500);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Slot generation -----------------------------------------------------

/**
 * Walk business-local calendar days across the requested range and lay slots
 * every 30 minutes. Weekdays start at 16:00; weekends at 09:00.
 * The last slot of any day ends at 21:00.
 */
function generateSlots(fromMs: number, toMs: number): Slot[] {
  const slots: Slot[] = [];
  const earliest = Date.now() + MIN_NOTICE_HOURS * HOUR;
  const anchor = getZonedParts(fromMs, BUSINESS_TIMEZONE);
  const cadence = SLOT_MINUTES + BUFFER_MINUTES;
  const spanDays = Math.ceil((toMs - fromMs) / (24 * 60 * MINUTE)) + 2;

  for (let i = 0; i < spanDays; i++) {
    // Date.UTC normalises day overflow, so this is just "i days after the
    // business-local date the range starts on".
    const cursor = new Date(
      Date.UTC(anchor.year, anchor.month - 1, anchor.day + i, 12),
    );
    const weekday = cursor.getUTCDay();
    if (!OPEN_WEEKDAYS.includes(weekday)) continue;

    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const day = cursor.getUTCDate();
    const startMinute =
      weekday === 0 || weekday === 6
        ? WEEKEND_START_MINUTE
        : WEEKDAY_START_MINUTE;

    for (
      let minute = startMinute;
      minute + SLOT_MINUTES <= WORK_END_MINUTE;
      minute += cadence
    ) {
      const startMs = zonedTimeToUtc(
        year,
        month,
        day,
        Math.floor(minute / 60),
        minute % 60,
        BUSINESS_TIMEZONE,
      );
      if (startMs > toMs) break;
      if (startMs < fromMs || startMs < earliest) continue;
      slots.push({
        startsAt: new Date(startMs).toISOString(),
        endsAt: new Date(startMs + SLOT_MINUTES * MINUTE).toISOString(),
      });
    }
  }
  return slots;
}

// ---- Validation ----------------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mirrors the client-side rules. Phase 2's server must re-run its own. */
function validate(req: BookingRequest): Record<string, string> {
  const errors: Record<string, string> = {};
  const { name, email } = req.lead;
  if (!name?.trim()) errors.name = "Tell us who we are meeting.";
  if (!email?.trim()) errors.email = "We need an email to send the invite.";
  else if (!EMAIL.test(email.trim())) errors.email = "That email looks off.";
  return errors;
}

function token(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

function mockMeetUrl(): string {
  // Deliberately obvious: nobody should mistake this for a real Meet link.
  return `https://meet.google.com/mock-${token(4)}-dev`;
}

// ---- Adapter -------------------------------------------------------------

export function createMockBookingApi(): BookingApi {
  return {
    async getAvailability(q: AvailabilityQuery): Promise<AvailabilityResult> {
      await latency();
      const fail = mockFail();
      if (fail === "availability") {
        throw new Error("Failed to fetch availability");
      }

      const fromMs = Date.parse(q.from);
      const toMs = Date.parse(q.to);
      const taken = takenStarts();
      const slots =
        fail === "empty_range"
          ? []
          : generateSlots(fromMs, toMs).filter((s) => !taken.has(s.startsAt));

      return {
        businessTimezone: BUSINESS_TIMEZONE,
        slotMinutes: SLOT_MINUTES,
        slots,
      };
    },

    async book(req: BookingRequest): Promise<BookingResult> {
      const fail = mockFail();
      await latency();

      // Transport failures throw; everything else is a typed result.
      if (fail === "network") {
        throw new TypeError("Failed to fetch");
      }

      const fieldErrors = validate(req);
      if (Object.keys(fieldErrors).length > 0) {
        return {
          ok: false,
          code: "invalid",
          message: "Some details still need a look.",
          fieldErrors,
        };
      }

      // A filled honeypot is a bot. Phase 2's server should accept and drop
      // rather than tell it what gave it away, so the mock does the same.
      if (req.context.honeypot.trim()) {
        return {
          ok: true,
          bookingId: `bk_${token(10)}`,
          startsAt: req.startsAt,
          endsAt: new Date(
            Date.parse(req.startsAt) + SLOT_MINUTES * MINUTE,
          ).toISOString(),
          meetUrl: null,
          manageToken: token(24),
        };
      }

      if (fail === "rate_limited") {
        return {
          ok: false,
          code: "rate_limited",
          message: "Too many attempts. Give it a minute and try again.",
        };
      }
      if (fail === "server_error") {
        return {
          ok: false,
          code: "server_error",
          message: "Something broke on our side. Nothing was booked.",
        };
      }

      const rows = readStore();
      const alreadyTaken =
        fail === "slot_taken" || rows.some((b) => b.startsAt === req.startsAt);
      if (alreadyTaken) {
        // Record it so the availability refresh that follows genuinely drops
        // the slot — the UI's recovery path is then the real one.
        if (!rows.some((b) => b.startsAt === req.startsAt)) {
          rows.push({
            bookingId: `bk_${token(10)}`,
            startsAt: req.startsAt,
            endsAt: new Date(
              Date.parse(req.startsAt) + SLOT_MINUTES * MINUTE,
            ).toISOString(),
            meetUrl: null,
            manageToken: token(24),
            createdAt: new Date().toISOString(),
            name: "(held by mockfail=slot_taken)",
            email: "",
            status: "confirmed",
          });
          writeStore(rows);
        }
        return {
          ok: false,
          code: "slot_taken",
          message: "Someone just took that time. Pick another and we are set.",
        };
      }

      const booking: StoredBooking = {
        bookingId: `bk_${token(10)}`,
        startsAt: req.startsAt,
        endsAt: new Date(
          Date.parse(req.startsAt) + SLOT_MINUTES * MINUTE,
        ).toISOString(),
        meetUrl: fail === "nomeet" ? null : mockMeetUrl(),
        manageToken: token(24),
        createdAt: new Date().toISOString(),
        name: req.lead.name,
        email: req.lead.email,
        status: "confirmed",
      };
      rows.push(booking);
      writeStore(rows);

      return {
        ok: true,
        bookingId: booking.bookingId,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        meetUrl: booking.meetUrl,
        manageToken: booking.manageToken,
      };
    },

    async cancel(req: CancelRequest): Promise<CancelResult> {
      await latency();
      const rows = readStore();
      const index = rows.findIndex(
        (b) => b.bookingId === req.bookingId && b.manageToken === req.manageToken,
      );
      if (index < 0) {
        return {
          ok: false,
          code: "not_found",
          message: "We could not find that booking.",
        };
      }
      if (rows[index].status === "cancelled") {
        return {
          ok: false,
          code: "already_cancelled",
          message: "That call is already cancelled.",
        };
      }
      // Mirrors phase 2: status flips to cancelled so the unique slot index
      // no longer holds the time, and the calendar event is dropped.
      rows[index] = { ...rows[index], status: "cancelled" };
      writeStore(rows);
      return { ok: true };
    },
  };
}
