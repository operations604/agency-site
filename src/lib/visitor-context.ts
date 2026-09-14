// Silently-captured context for a booking. Never rendered as form fields.
//
// Captured once, at first import, so it reflects the page the visitor
// actually landed on. Mirrored into sessionStorage so attribution survives
// a reload inside the same visit — first touch wins.

import type { BookingContext } from "./booking-api";

const STORAGE_KEY = "applied.booking.visit.v1";

type Captured = {
  utm: Record<string, string>;
  referrer: string;
  landingPath: string;
  landedAt: number;
};

function readStored(): Captured | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Captured;
    if (!parsed || typeof parsed.landingPath !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function capture(): Captured {
  const utm: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params) {
      // gclid/fbclid are ad-click ids, not utm_*, but phase 2 wants them too.
      if (key.startsWith("utm_") || key === "gclid" || key === "fbclid") {
        utm[key] = value;
      }
    }
  } catch {
    /* no query string is not an error */
  }
  return {
    utm,
    referrer: document.referrer || "",
    landingPath: window.location.pathname + window.location.hash,
    landedAt: Date.now(),
  };
}

const visit: Captured = (() => {
  const stored = readStored();
  // A fresh utm-carrying URL overrides a stored visit with no attribution;
  // otherwise the first touch of this session is kept.
  if (stored && Object.keys(stored.utm).length > 0) return stored;
  const fresh = capture();
  const merged =
    stored && Object.keys(fresh.utm).length === 0 ? stored : fresh;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* private mode: context is best-effort, never blocking */
  }
  return merged;
})();

/**
 * @param honeypot value of the decoy field — non-empty means a bot
 * @param formStartedAt when the details form first mounted, for time-to-submit
 */
export function buildBookingContext(
  honeypot: string,
  formStartedAt: number,
): BookingContext {
  return {
    utm: visit.utm,
    referrer: visit.referrer,
    landingPath: visit.landingPath,
    honeypot,
    formMs: Math.max(0, Math.round(Date.now() - formStartedAt)),
  };
}
