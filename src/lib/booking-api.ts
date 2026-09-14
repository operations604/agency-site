// The booking API contract.
//
// Phase 1 ships the mock adapter behind this interface. Phase 2 replaces the
// implementation with a real server and changes nothing else in the app.
//
// Rules that keep phase 2 cheap:
//   - Every timestamp crossing this boundary is a UTC ISO string. Convert for
//     display only.
//   - `meetUrl` is nullable from day one: the server must be able to save a
//     booking even when Google fails, and the UI already handles a
//     confirmation with no link.
//   - Expected failures come back as typed results. Only transport failures
//     throw.
//   - No component calls `fetch` directly. Everything goes through this
//     interface.

import { createMockBookingApi } from "./booking-api.mock";
import { createHttpBookingApi } from "./booking-api.http";

export type Slot = { startsAt: string; endsAt: string }; // UTC ISO

export type AvailabilityQuery = {
  from: string;
  to: string;
  timezone: string;
};

export type AvailabilityResult = {
  businessTimezone: string;
  slotMinutes: number;
  slots: Slot[];
};

/** Name, work email, and the typed problem. Nothing else. */
export type BookingLead = {
  name: string;
  email: string;
  painPoint: string;
};

/**
 * Captured silently — never shown as form fields.
 *
 * `honeypot` and `formMs` extend the original §2 sketch: §4 requires a
 * honeypot and a time-to-submit in the payload, and this is the object that
 * already means "collected without asking". Phase 2's server reads both to
 * throttle spam — a filled honeypot or a sub-second `formMs` is a bot.
 */
export type BookingContext = {
  utm: Record<string, string>;
  referrer: string;
  landingPath: string;
  honeypot: string;
  formMs: number;
};

export type BookingRequest = {
  startsAt: string;
  timezone: string;
  locale: string;
  lead: BookingLead;
  context: BookingContext;
};

export type BookingErrorCode =
  | "slot_taken"
  | "invalid"
  | "rate_limited"
  | "server_error";

export type BookingResult =
  | {
      ok: true;
      bookingId: string;
      startsAt: string;
      endsAt: string;
      meetUrl: string | null;
      manageToken: string;
    }
  | {
      ok: false;
      code: BookingErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type CancelRequest = {
  bookingId: string;
  manageToken: string;
};

export type CancelErrorCode = "not_found" | "already_cancelled" | "server_error";

export type CancelResult =
  | { ok: true }
  | { ok: false; code: CancelErrorCode; message: string };

export interface BookingApi {
  getAvailability(q: AvailabilityQuery): Promise<AvailabilityResult>;
  book(req: BookingRequest): Promise<BookingResult>;
  /**
   * Same outcome as the cancel link on the invite email.
   * Phase 2 writes `bookings.status = 'cancelled'` in Supabase (the unique
   * slot index then lets the time be booked again) and deletes or cancels
   * the Google Calendar event so the slot is free on the real calendar.
   */
  cancel(req: CancelRequest): Promise<CancelResult>;
}

/** How far ahead the UI asks for availability. The server decides the slots. */
export const BOOKING_WINDOW_DAYS = 30;

const WINDMILL_BOOKING_API =
  "https://windmill.unlimitedholdings.org/api/r/applied/";

const apiUrl =
  import.meta.env.VITE_BOOKING_API_URL?.trim() ||
  (import.meta.env.PROD ? WINDMILL_BOOKING_API : "");

function apiBase(): string | null {
  if (!apiUrl) return null;
  if (apiUrl === "/" || apiUrl === "same-origin") {
    return `${window.location.origin}/`;
  }
  return apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
}

/**
 * True while phase 1's mock is the implementation. The confirmation screen
 * reads this so it never claims an email was sent that nothing sent.
 */
export const bookingApiIsMock = !apiUrl;

const base = apiBase();
export const bookingApi: BookingApi = base
  ? createHttpBookingApi(base)
  : createMockBookingApi();
