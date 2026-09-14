// Phase 2's adapter, written now so the cutover is a URL and a deploy.
//
// Selected when VITE_BOOKING_API_URL is set. Nothing here runs in phase 1 —
// the server it talks to does not exist yet — but the request bodies and the
// typed error mapping are already correct, so phase 2 implements the two
// endpoints below and deletes the mock.
//
// No auth headers: the server holds every secret and this client has none to
// send. Do not add any without deciding what the server actually checks.

import type {
  AvailabilityQuery,
  AvailabilityResult,
  BookingApi,
  BookingErrorCode,
  BookingRequest,
  BookingResult,
} from "./booking-api";

type ServerError = {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Permissive shape: the server is not written yet, so nothing is trusted. */
type BookResponseBody = ServerError & {
  ok?: boolean;
  bookingId?: string;
  startsAt?: string;
  endsAt?: string;
  meetUrl?: string | null;
  manageToken?: string;
};

const CODES: BookingErrorCode[] = [
  "slot_taken",
  "invalid",
  "rate_limited",
  "server_error",
];

/** HTTP status is the contract; a matching body `code` refines it. */
function mapErrorCode(status: number, body: ServerError): BookingErrorCode {
  const declared = CODES.find((c) => c === body.code);
  if (declared) return declared;
  if (status === 409) return "slot_taken";
  if (status === 400 || status === 422) return "invalid";
  if (status === 429) return "rate_limited";
  return "server_error";
}

const DEFAULT_MESSAGES: Record<BookingErrorCode, string> = {
  slot_taken: "Someone just took that time. Pick another and we are set.",
  invalid: "Some details still need a look.",
  rate_limited: "Too many attempts. Give it a minute and try again.",
  server_error: "Something broke on our side. Nothing was booked.",
};

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function createHttpBookingApi(baseUrl: string): BookingApi {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    async getAvailability(q: AvailabilityQuery): Promise<AvailabilityResult> {
      const url = new URL("availability", base);
      url.searchParams.set("from", q.from);
      url.searchParams.set("to", q.to);
      url.searchParams.set("timezone", q.timezone);

      // Availability has no typed failure in the contract, so anything other
      // than a good response is a transport failure and throws.
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Availability request failed (${res.status})`);
      }
      return (await res.json()) as AvailabilityResult;
    },

    async book(req: BookingRequest): Promise<BookingResult> {
      // fetch itself throws on a transport failure, which is what the UI's
      // network-error state catches. Everything the server answers with is
      // turned into a typed result instead.
      const res = await fetch(new URL("bookings", base).toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(req),
      });

      const body = (await readJson(res)) as BookResponseBody | null;

      if (!res.ok || body?.ok === false) {
        const error = body ?? {};
        const code = mapErrorCode(res.status, error);
        return {
          ok: false,
          code,
          message: error.message || DEFAULT_MESSAGES[code],
          fieldErrors: error.fieldErrors,
        };
      }

      if (!body || typeof body.bookingId !== "string") {
        return {
          ok: false,
          code: "server_error",
          message: DEFAULT_MESSAGES.server_error,
        };
      }

      return {
        ok: true,
        bookingId: body.bookingId,
        startsAt: body.startsAt ?? "",
        endsAt: body.endsAt ?? "",
        // Nullable by design: phase 2 saves the booking even when Google
        // fails, and answers with meetUrl null rather than losing the lead.
        meetUrl: body.meetUrl ?? null,
        manageToken: body.manageToken ?? "",
      };
    },
  };
}
