// Booking rules + Supabase + Google Calendar.
// Runs inside the Coolify Node process — secrets stay here, never in the Vite bundle.

import postgres from "postgres";

export const CONFIG = {
  businessTimezone: "America/New_York",
  openWeekdays: [0, 1, 2, 3, 4, 5, 6],
  weekdayStartMinute: 16 * 60,
  weekendStartMinute: 9 * 60,
  workEndMinute: 21 * 60,
  slotMinutes: 30,
  bufferMinutes: 15,
  minNoticeHours: 12,
  windowDays: 30,
  minFormMs: 1500,
  maxBooksPerEmailPerHour: 5,
  eventTitle: "Applied Systems — intro call",
  calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || "primary",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** @type {import("postgres").Sql | null} */
let pool = null;

function sql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!pool) {
    // Cloud Supabase needs SSL. Self-hosted Docker Postgres usually does not.
    const ssl =
      process.env.DATABASE_SSL === "require" ||
      /sslmode=require/i.test(url);
    pool = postgres(url, {
      ssl: ssl ? "require" : false,
      max: 8,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return pool;
}

function zonedParts(utcMs, timeZone) {
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
  const week = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const out = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0, weekday: 0 };
  for (const p of parts) {
    if (p.type === "weekday") out.weekday = week[p.value] ?? 0;
    else if (p.type in out && p.type !== "weekday") {
      const n = Number(p.value);
      out[p.type] = p.type === "hour" && n === 24 ? 0 : n;
    }
  }
  return out;
}

function zoneOffsetMs(utcMs, timeZone) {
  const p = zonedParts(utcMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = zoneOffsetMs(guess, timeZone);
  let utc = guess - first;
  const second = zoneOffsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return utc;
}

function isOfferedStart(utcMs) {
  const p = zonedParts(utcMs, CONFIG.businessTimezone);
  if (!CONFIG.openWeekdays.includes(p.weekday)) return false;
  const weekend = p.weekday === 0 || p.weekday === 6;
  const start = weekend ? CONFIG.weekendStartMinute : CONFIG.weekdayStartMinute;
  const minuteOfDay = p.hour * 60 + p.minute;
  const cadence = CONFIG.slotMinutes + CONFIG.bufferMinutes;
  return (
    minuteOfDay >= start &&
    minuteOfDay + CONFIG.slotMinutes <= CONFIG.workEndMinute &&
    (minuteOfDay - start) % cadence === 0
  );
}

function generateSlots(fromMs, toMs) {
  const slots = [];
  const earliest = Date.now() + CONFIG.minNoticeHours * 60 * 60 * 1000;
  const anchor = zonedParts(fromMs, CONFIG.businessTimezone);
  const cadence = CONFIG.slotMinutes + CONFIG.bufferMinutes;
  const spanDays = Math.ceil((toMs - fromMs) / 86_400_000) + 2;
  const slotMs = CONFIG.slotMinutes * 60_000;

  for (let i = 0; i < spanDays; i++) {
    const cursor = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day + i, 12));
    const weekday = cursor.getUTCDay();
    if (!CONFIG.openWeekdays.includes(weekday)) continue;
    const weekend = weekday === 0 || weekday === 6;
    const startMinute = weekend ? CONFIG.weekendStartMinute : CONFIG.weekdayStartMinute;
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const day = cursor.getUTCDate();
    for (
      let minute = startMinute;
      minute + CONFIG.slotMinutes <= CONFIG.workEndMinute;
      minute += cadence
    ) {
      const startMs = zonedTimeToUtc(
        year,
        month,
        day,
        Math.floor(minute / 60),
        minute % 60,
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

let cachedGoogle = { token: null, expiresAt: 0 };

async function googleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refresh = process.env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refresh) return null;
  if (cachedGoogle.token && Date.now() < cachedGoogle.expiresAt - 30_000) {
    return cachedGoogle.token;
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.access_token) return null;
  cachedGoogle = {
    token: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000,
  };
  return cachedGoogle.token;
}

async function busyBlocks(fromIso, toIso) {
  const token = await googleAccessToken();
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
  const json = await res.json();
  const busy =
    json.calendars?.[CONFIG.calendarId]?.busy ?? json.calendars?.primary?.busy ?? [];
  return busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

function overlaps(slot, busy) {
  const a = Date.parse(slot.startsAt);
  const b = Date.parse(slot.endsAt);
  return busy.some((x) => a < x.end && b > x.start);
}

export async function getAvailability(from, to, timezone) {
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || !timezone) {
    const err = new Error("from, to, and timezone are required");
    err.status = 400;
    throw err;
  }

  const taken = await sql()`
    select date, time
    from "Applied_Bookings".bookings
  `;
  const takenSet = new Set(
    taken.map((r) => {
      const ds = r.date instanceof Date
        ? `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, "0")}-${String(r.date.getUTCDate()).padStart(2, "0")}`
        : String(r.date).slice(0, 10);
      const [y, m, d] = ds.split("-").map(Number);
      const [hh, min] = String(r.time).split(":").map(Number);
      return new Date(zonedTimeToUtc(y, m, d, hh || 0, min || 0, CONFIG.businessTimezone)).toISOString();
    }),
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
}

function fail(code, message, fieldErrors) {
  return { ok: false, code, message, fieldErrors };
}

function fakeOk() {
  return {
    ok: true,
    bookingId: crypto.randomUUID(),
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + CONFIG.slotMinutes * 60_000).toISOString(),
    meetUrl: null,
    manageToken: crypto.randomUUID().replaceAll("-", ""),
  };
}

function validate(req) {
  const errors = {};
  const lead = req.lead ?? {};
  if (!lead.name?.trim()) errors.name = "Tell us who we are meeting.";
  if (!lead.email?.trim()) errors.email = "We need an email to send the invite.";
  else if (!EMAIL_RE.test(lead.email.trim())) errors.email = "That email looks off.";
  if (!lead.company?.trim()) errors.company = "Which company is this for?";
  if (!lead.painPoint?.trim()) {
    errors.painPoint = "A sentence is plenty — what is eating your time?";
  }
  if (!req.startsAt || !Number.isFinite(Date.parse(req.startsAt))) {
    errors.startsAt = "Pick a time.";
  }
  if (!req.timezone) errors.timezone = "Missing timezone.";
  return errors;
}

async function sha256Hex(value) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function token(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

async function createMeet(args) {
  const access = await googleAccessToken();
  if (!access) return null;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CONFIG.calendarId)}/events` +
      `?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${access}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: CONFIG.eventTitle,
        description: [
          `${args.lead.name} · ${args.lead.company}`,
          args.lead.email,
          "",
          args.lead.painPoint,
        ].join("\n"),
        start: { dateTime: args.startsAt, timeZone: "UTC" },
        end: { dateTime: args.endsAt, timeZone: "UTC" },
        attendees: [{ email: args.lead.email, displayName: args.lead.name }],
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 10 },
            { method: "popup", minutes: 10 },
          ],
        },
        conferenceData: {
          createRequest: {
            requestId: args.bookingId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  if (!res.ok) return null;
  const event = await res.json();
  const meet =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    null;
  if (!event.id) return null;
  return { eventId: event.id, meetUrl: meet };
}

export async function createBooking(req) {
  const ctx = req.context ?? {};
  if ((ctx.honeypot ?? "").trim() || (ctx.formMs ?? 99999) < CONFIG.minFormMs) {
    return { status: 200, body: fakeOk() };
  }

  const fieldErrors = validate(req);
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 400, body: fail("invalid", "Some details still need a look.", fieldErrors) };
  }

  const startMs = Date.parse(req.startsAt);
  const endMs = startMs + CONFIG.slotMinutes * 60_000;
  const earliest = Date.now() + CONFIG.minNoticeHours * 60 * 60 * 1000;
  const latest = Date.now() + CONFIG.windowDays * 86_400_000;
  if (startMs < earliest || startMs > latest || !isOfferedStart(startMs)) {
    return {
      status: 400,
      body: fail("invalid", "That time is not open.", { startsAt: "Pick another time." }),
    };
  }

  const leadRow = {
    name: req.lead.name.trim(),
    email: req.lead.email.trim().toLowerCase(),
    company: req.lead.company.trim(),
    painPoint: req.lead.painPoint.trim(),
  };
  const manageToken = token(32);
  const ny = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.businessTimezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(startMs));
  const part = (t) => ny.find((p) => p.type === t)?.value ?? "00";
  const hour = part("hour") === "24" ? "00" : part("hour");
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const time = `${hour}:${part("minute")}:00`;
  const notes = `${leadRow.painPoint}\n\nCompany: ${leadRow.company}`;
  const db = sql();

  let inserted;
  try {
    inserted = await db`
      insert into "Applied_Bookings".bookings (
        name, email, date, time, notes
      ) values (
        ${leadRow.name}, ${leadRow.email},
        ${date}::date, ${time}::time, ${notes}
      )
      returning id
    `;
  } catch (err) {
    if (err?.code === "23505") {
      return {
        status: 409,
        body: fail("slot_taken", "Someone just took that time. Pick another and we are set."),
      };
    }
    throw err;
  }

  const bookingId = inserted[0].id;
  const startsAtIso = new Date(startMs).toISOString();
  const endsAtIso = new Date(endMs).toISOString();

  let meetUrl = null;
  let status = "confirmed";
  let googleEventId = null;

  try {
    const created = await createMeet({
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      lead: leadRow,
      bookingId,
    });
    if (!created) {
      status = "needs_manual_invite";
    } else {
      googleEventId = created.eventId;
      meetUrl = created.meetUrl;
      if (!meetUrl) status = "needs_manual_invite";
    }
  } catch {
    status = "needs_manual_invite";
  }

  await db`
    update "Applied_Bookings".bookings
    set meet_url = ${meetUrl}
    where id = ${bookingId}::uuid
  `;

  return {
    status: 200,
    body: {
      ok: true,
      bookingId,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      meetUrl,
      manageToken,
    },
  };
}
