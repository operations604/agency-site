// Windmill Bun script — path f/applied/booking_availability
// HTTP: GET /api/r/applied/availability?from=&to=&timezone=
// Reads "Applied_Bookings".bookings via f/Webull/supabase_postgres.
// Does not write Webull tables.

import * as wmill from "windmill-client";
import postgres from "postgres";

const CONFIG = {
  businessTimezone: "America/New_York",
  openWeekdays: [0, 1, 2, 3, 4, 5, 6],
  weekdayStartMinute: 16 * 60,
  weekendStartMinute: 9 * 60,
  workEndMinute: 21 * 60,
  slotMinutes: 30,
  bufferMinutes: 0,
  minNoticeHours: 12,
  windowDays: 30,
  supabaseResource: "f/Webull/supabase_postgres",
  googleResource: "f/applied/google_calendar",
  calendarId: "primary",
};

type Postgresql = {
  host: string;
  port: number | string;
  user: string;
  dbname?: string;
  database?: string;
  password: string;
  sslmode?: string;
  ssl?: boolean;
};

type GCal = { token?: string; access_token?: string };

type Slot = { startsAt: string; endsAt: string };

function sqlClient(db: Postgresql) {
  const mode = (db.sslmode || "").toLowerCase();
  let ssl: false | "require" = false;
  if (db.ssl === true || mode === "require" || mode === "verify-ca" || mode === "verify-full") {
    ssl = "require";
  }
  if (db.ssl === false || mode === "disable") ssl = false;
  return postgres({
    host: db.host,
    port: Number(db.port) || 5432,
    user: db.user,
    database: db.dbname || db.database,
    password: db.password,
    ssl,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
  });
}

function zonedParts(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
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
  const week: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const out = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0, weekday: 0 };
  for (const p of parts) {
    if (p.type === "weekday") out.weekday = week[p.value] ?? 0;
    else if (p.type in out && p.type !== "weekday") {
      const n = Number(p.value);
      (out as Record<string, number>)[p.type] =
        p.type === "hour" && n === 24 ? 0 : n;
    }
  }
  return out;
}

function zoneOffsetMs(utcMs: number, timeZone: string) {
  const p = zonedParts(utcMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = zoneOffsetMs(guess, timeZone);
  let utc = guess - first;
  const second = zoneOffsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return utc;
}

function hoursForWeekday(weekday: number) {
  const weekend = weekday === 0 || weekday === 6;
  return {
    start: weekend ? CONFIG.weekendStartMinute : CONFIG.weekdayStartMinute,
    end: CONFIG.workEndMinute,
  };
}

function generateSlots(fromMs: number, toMs: number): Slot[] {
  const slots: Slot[] = [];
  const earliest = Date.now() + CONFIG.minNoticeHours * 60 * 60 * 1000;
  const anchor = zonedParts(fromMs, CONFIG.businessTimezone);
  const cadence = CONFIG.slotMinutes + CONFIG.bufferMinutes;
  const spanDays = Math.ceil((toMs - fromMs) / 86_400_000) + 2;
  const slotMs = CONFIG.slotMinutes * 60_000;

  for (let i = 0; i < spanDays; i++) {
    const cursor = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day + i, 12));
    const weekday = cursor.getUTCDay();
    if (!CONFIG.openWeekdays.includes(weekday)) continue;
    const hours = hoursForWeekday(weekday);
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const day = cursor.getUTCDate();
    for (
      let minute = hours.start;
      minute + CONFIG.slotMinutes <= hours.end;
      minute += cadence
    ) {
      const startMs = zonedTimeToUtc(
        year, month, day, Math.floor(minute / 60), minute % 60,
        CONFIG.businessTimezone,
      );
      if (startMs > toMs) break;
      if (startMs < fromMs || startMs < earliest) continue;
      slots.push({
        startsAt: new Date(startMs).toISOString(),
        endsAt: new Date(startMs + slotMs).toISOString(),
      });
    }
  }
  return slots;
}

async function googleToken(): Promise<string | null> {
  try {
    const g = (await wmill.getResource(CONFIG.googleResource)) as GCal;
    return g.token || g.access_token || null;
  } catch {
    return null;
  }
}

async function busyBlocks(fromIso: string, toIso: string): Promise<{ start: number; end: number }[]> {
  const token = await googleToken();
  if (!token) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin: fromIso,
      timeMax: toIso,
      items: [{ id: CONFIG.calendarId }],
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };
  const busy = json.calendars?.[CONFIG.calendarId]?.busy ?? json.calendars?.primary?.busy ?? [];
  return busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

function overlaps(slot: Slot, busy: { start: number; end: number }[]) {
  const a = Date.parse(slot.startsAt);
  const b = Date.parse(slot.endsAt);
  return busy.some((x) => a < x.end && b > x.start);
}

export async function preprocessor(event: {
  kind?: string;
  query?: Record<string, string>;
}) {
  if (event?.kind === "http") {
    return {
      from: event.query?.from,
      to: event.query?.to,
      timezone: event.query?.timezone,
    };
  }
  return {};
}

export async function main(from: string, to: string, timezone: string) {
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || !timezone) {
    throw new Error("from, to, and timezone are required");
  }

  const db = (await wmill.getResource(CONFIG.supabaseResource)) as Postgresql;
  const sql = sqlClient(db);

  try {
    const taken = await sql<{ date: Date | string; time: string }[]>`
      select date, time
      from "Applied_Bookings".bookings
      where status is distinct from 'cancelled'
    `;
    const takenSet = new Set(
      taken
        .map((r) => {
          const ds = r.date instanceof Date
            ? `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, "0")}-${String(r.date.getUTCDate()).padStart(2, "0")}`
            : String(r.date).slice(0, 10);
          const [y, m, d] = ds.split("-").map(Number);
          const [hh, min] = String(r.time).split(":").map(Number);
          if (!y || !m || !d) return "";
          return new Date(zonedTimeToUtc(y, m, d, hh || 0, min || 0, CONFIG.businessTimezone)).toISOString();
        })
        .filter(Boolean),
    );
    const busy = await busyBlocks(from, to);

    const slots = generateSlots(fromMs, toMs).filter(
      (s) => !takenSet.has(s.startsAt) && !overlaps(s, busy),
    );

    return {
      businessTimezone: CONFIG.businessTimezone,
      slotMinutes: CONFIG.slotMinutes,
      slots,
    };
  } finally {
    await sql.end({ timeout: 2 });
  }
}
