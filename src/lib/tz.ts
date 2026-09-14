// Timezone math with Intl only — no date library, no new runtime dependency.
//
// Every instant that crosses the booking API boundary is a UTC ISO string.
// These helpers do two jobs:
//   1. turn business-local working hours into real UTC instants (the mock
//      adapter generating slots),
//   2. render a UTC instant in whatever zone the visitor is reading in.

const PART_KEYS = ["year", "month", "day", "hour", "minute", "second"] as const;
type PartKey = (typeof PART_KEYS)[number];

export type ZonedParts = Record<PartKey, number> & { weekday: number };

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Intl.DateTimeFormat construction is the expensive part, so every formatter
// below is memoised on its options.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(
  key: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const cacheKey = `${key}|${locale}|${options.timeZone ?? ""}`;
  let f = formatterCache.get(cacheKey);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(cacheKey, f);
  }
  return f;
}

/** Wall-clock fields of a UTC instant as read in `timeZone`. */
export function getZonedParts(utcMs: number, timeZone: string): ZonedParts {
  const parts = formatter("parts", "en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(utcMs));

  const out: ZonedParts = {
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
    minute: 0,
    second: 0,
    weekday: 0,
  };
  for (const p of parts) {
    if (p.type === "weekday") {
      out.weekday = WEEKDAY_INDEX[p.value] ?? 0;
    } else if ((PART_KEYS as readonly string[]).includes(p.type)) {
      const n = Number(p.value);
      // hour12:false renders midnight as "24" in some engines.
      out[p.type as PartKey] = p.type === "hour" && n === 24 ? 0 : n;
    }
  }
  return out;
}

/** Offset of `timeZone` at that instant, in ms (east of UTC is positive). */
export function getZoneOffsetMs(utcMs: number, timeZone: string): number {
  const p = getZonedParts(utcMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Parts are second-resolution, so compare against a second-floored instant.
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * The UTC instant of a wall-clock time in `timeZone`.
 *
 * Guess the instant as if the fields were UTC, correct by that instant's
 * offset, then re-check once: a single correction can land on the other side
 * of a DST transition, and the second read settles it.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = getZoneOffsetMs(guess, timeZone);
  let utc = guess - first;
  const second = getZoneOffsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return utc;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Stable "YYYY-MM-DD" key for the calendar day an instant falls on. */
export function dayKey(utcMs: number, timeZone: string): string {
  const p = getZonedParts(utcMs, timeZone);
  return makeDayKey(p.year, p.month, p.day);
}

export function makeDayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDayKey(key: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

/** Day key `offset` days after `key`, using UTC arithmetic on the fields. */
export function shiftDayKey(key: string, offset: number): string {
  const { year, month, day } = parseDayKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + offset));
  return makeDayKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 0 = Sunday. Computed on a UTC noon anchor so no zone can shift the date. */
export function dayKeyWeekday(key: string): number {
  const { year, month, day } = parseDayKey(key);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function compareDayKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Noon on that calendar day, as a UTC instant — safe to format for display. */
export function dayKeyNoonUtc(key: string): number {
  const { year, month, day } = parseDayKey(key);
  return Date.UTC(year, month - 1, day, 12);
}

export function formatTime(
  utcMs: number,
  timeZone: string,
  locale: string,
): string {
  return formatter("time", locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(utcMs));
}

export function formatDayLong(
  utcMs: number,
  timeZone: string,
  locale: string,
): string {
  return formatter("dayLong", locale, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(utcMs));
}

export function formatDayMedium(
  utcMs: number,
  timeZone: string,
  locale: string,
): string {
  return formatter("dayMedium", locale, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(utcMs));
}

export function formatMonthYear(
  utcMs: number,
  timeZone: string,
  locale: string,
): string {
  return formatter("monthYear", locale, {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(new Date(utcMs));
}

/** Short zone name at that instant, e.g. "EDT" — falls back to the offset. */
export function zoneAbbrev(
  utcMs: number,
  timeZone: string,
  locale: string,
): string {
  const parts = formatter("abbrev", locale, {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date(utcMs));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** "GMT-4" style label, used to annotate the zone picker. */
export function zoneOffsetLabel(timeZone: string, utcMs = Date.now()): string {
  try {
    const parts = formatter("offset", "en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date(utcMs));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function localeTag(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
  } catch {
    return "en-US";
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// A short, always-available list so the picker still works on engines without
// Intl enumeration (Intl.supportedValuesOf landed later than our other APIs).
const FALLBACK_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
];

let zoneList: string[] | null = null;

export function listTimeZones(): string[] {
  if (zoneList) return zoneList;
  const withEnum = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  let zones: string[] = [];
  try {
    zones = withEnum.supportedValuesOf?.("timeZone") ?? [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = FALLBACK_ZONES;
  zoneList = Array.from(new Set(zones)).sort();
  return zoneList;
}
