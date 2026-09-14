// Windmill Bun script — path f/applied/booking_create
// HTTP: POST /api/r/applied/bookings  (wrap body ON)
// Writes "Applied_Bookings".bookings via f/Webull/supabase_postgres.
// Does not write Webull tables.
// Google is optional: missing f/applied/google_calendar still saves the row.

import * as wmill from "windmill-client";
import postgres from "postgres";

const CONFIG = {
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
  eventTitle: "Applied Systems intro call",
  organizerName: "Applied Systems",
  supabaseResource: "f/Webull/supabase_postgres",
  googleResource: "f/applied/google_calendar",
  calendarId: "primary",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

type Lead = {
  name?: string;
  email?: string;
  painPoint?: string;
};

type Ctx = {
  utm?: Record<string, string>;
  referrer?: string;
  landingPath?: string;
  honeypot?: string;
  formMs?: number;
};

type BookingRequest = {
  startsAt?: string;
  timezone?: string;
  locale?: string;
  lead?: Lead;
  context?: Ctx;
};

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

function fail(code: string, message: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, code, message, fieldErrors };
}

function fakeOk() {
  return {
    ok: true as const,
    bookingId: crypto.randomUUID(),
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + CONFIG.slotMinutes * 60_000).toISOString(),
    meetUrl: null,
    manageToken: crypto.randomUUID().replaceAll("-", ""),
  };
}

function validate(req: BookingRequest): Record<string, string> {
  const errors: Record<string, string> = {};
  const lead = req.lead ?? {};
  if (!lead.name?.trim()) errors.name = "Tell us who we are meeting.";
  if (!lead.email?.trim()) errors.email = "We need an email to send the invite.";
  else if (!EMAIL_RE.test(lead.email.trim())) errors.email = "That email looks off.";
  if (!req.startsAt || !Number.isFinite(Date.parse(req.startsAt))) {
    errors.startsAt = "Pick a time.";
  }
  if (!req.timezone) errors.timezone = "Missing timezone.";
  return errors;
}

function token(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

function nyDateTime(utcMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.businessTimezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  const week: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}:00`,
    weekday: week[get("weekday")] ?? 0,
    minuteOfDay: Number(hour) * 60 + Number(get("minute")),
  };
}

function isOfferedStart(utcMs: number) {
  const { weekday, minuteOfDay } = nyDateTime(utcMs);
  if (!CONFIG.openWeekdays.includes(weekday)) return false;
  const weekend = weekday === 0 || weekday === 6;
  const start = weekend ? CONFIG.weekendStartMinute : CONFIG.weekdayStartMinute;
  const cadence = CONFIG.slotMinutes + CONFIG.bufferMinutes;
  return (
    minuteOfDay >= start &&
    minuteOfDay + CONFIG.slotMinutes <= CONFIG.workEndMinute &&
    (minuteOfDay - start) % cadence === 0
  );
}

function accessToken(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const nested = g.value && typeof g.value === "object" ? (g.value as Record<string, unknown>) : null;
  const token = g.token || g.access_token || nested?.token || nested?.access_token;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

async function googleToken(): Promise<string | null> {
  try {
    return accessToken(await wmill.getResource(CONFIG.googleResource));
  } catch {
    return null;
  }
}

async function nameAsAppliedSystems(access: string) {
  const headers = {
    authorization: `Bearer ${access}`,
    "content-type": "application/json",
  };
  const calendar = encodeURIComponent(CONFIG.calendarId);
  const calGet = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendar}`,
    { headers },
  );
  if (calGet.ok) {
    const json = (await calGet.json()) as { summary?: string };
    if (json.summary !== CONFIG.organizerName) {
      const patch = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendar}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ summary: CONFIG.organizerName }),
        },
      );
      if (!patch.ok) {
        console.error("Calendar rename failed", patch.status, await patch.text());
      }
    }
  }

  const sendAs = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs",
    { headers },
  );
  if (sendAs.ok) {
    const json = (await sendAs.json()) as {
      sendAs?: { sendAsEmail?: string; displayName?: string; isPrimary?: boolean }[];
    };
    const primary =
      json.sendAs?.find((s) => s.isPrimary) ?? json.sendAs?.[0];
    if (primary?.sendAsEmail && primary.displayName !== CONFIG.organizerName) {
      const patch = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/${encodeURIComponent(primary.sendAsEmail)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ displayName: CONFIG.organizerName }),
        },
      );
      if (!patch.ok) {
        console.error("Gmail sendAs name failed", patch.status, await patch.text());
      }
    }
  }

  const me = await fetch(
    "https://people.googleapis.com/v1/people/me?personFields=names",
    { headers },
  );
  if (me.ok) {
    const person = (await me.json()) as {
      etag?: string;
      names?: { displayName?: string }[];
    };
    if (person.names?.[0]?.displayName !== CONFIG.organizerName) {
      const patch = await fetch(
        "https://people.googleapis.com/v1/people/me?updatePersonFields=names",
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            etag: person.etag,
            names: [
              { givenName: "Applied", familyName: "Systems", displayName: CONFIG.organizerName },
            ],
          }),
        },
      );
      if (!patch.ok) {
        console.error("Google profile name failed", patch.status, await patch.text());
      }
    }
  }
}

function meetFromEvent(event: {
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
}) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    null
  );
}

async function createMeet(args: {
  startsAt: string;
  endsAt: string;
  lead: { name: string; email: string; painPoint: string };
  bookingId: string;
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  const access = await googleToken();
  if (!access) {
    console.error("Google Calendar resource f/applied/google_calendar has no token");
    return null;
  }

  await nameAsAppliedSystems(access);

  const calendar = encodeURIComponent(CONFIG.calendarId);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events` +
      `?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${access}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: CONFIG.eventTitle,
        description: [args.lead.name, args.lead.email, args.lead.painPoint]
          .filter(Boolean)
          .join("\n"),
        source: {
          title: CONFIG.organizerName,
          url: "https://appliedsystems.com",
        },
        start: { dateTime: args.startsAt, timeZone: "UTC" },
        end: { dateTime: args.endsAt, timeZone: "UTC" },
        attendees: [
          { email: args.lead.email, displayName: args.lead.name, responseStatus: "needsAction" },
        ],
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: false,
        reminders: {
          useDefault: false,
          overrides: [{ method: "email", minutes: 10 }, { method: "popup", minutes: 10 }],
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

  if (!res.ok) {
    console.error("Google Calendar create failed", res.status, await res.text());
    return null;
  }
  let event = (await res.json()) as {
    id?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };
  if (!event.id) return null;

  let meetUrl = meetFromEvent(event);
  if (!meetUrl) {
    const get = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events/${encodeURIComponent(event.id)}` +
        `?conferenceDataVersion=1`,
      { headers: { authorization: `Bearer ${access}` } },
    );
    if (get.ok) event = await get.json();
    meetUrl = meetFromEvent(event);
  }
  return { eventId: event.id, meetUrl };
}

export async function main(
  startsAt?: string,
  timezone?: string,
  locale?: string,
  lead?: Lead,
  context?: Ctx,
  body?: BookingRequest,
) {
  const req: BookingRequest = body ?? { startsAt, timezone, locale, lead, context };
  const ctx = req.context ?? {};

  if ((ctx.honeypot ?? "").trim() || (ctx.formMs ?? 99999) < CONFIG.minFormMs) {
    return fakeOk();
  }

  const fieldErrors = validate(req);
  if (Object.keys(fieldErrors).length > 0) {
    return fail("invalid", "Some details still need a look.", fieldErrors);
  }

  const startMs = Date.parse(req.startsAt!);
  const endMs = startMs + CONFIG.slotMinutes * 60_000;
  const earliest = Date.now() + CONFIG.minNoticeHours * 60 * 60 * 1000;
  const latest = Date.now() + CONFIG.windowDays * 86_400_000;
  if (startMs < earliest || startMs > latest || !isOfferedStart(startMs)) {
    return fail("invalid", "That time is not open.", { startsAt: "Pick another time." });
  }

  const db = (await wmill.getResource(CONFIG.supabaseResource)) as Postgresql;
  const sql = sqlClient(db);
  const leadRow = {
    name: req.lead!.name!.trim(),
    email: req.lead!.email!.trim().toLowerCase(),
    painPoint: (req.lead!.painPoint ?? "").trim(),
  };
  const manageToken = token(32);
  const { date, time } = nyDateTime(startMs);
  const notes = leadRow.painPoint || null;

  try {
    let inserted: { id: string }[];
    try {
      inserted = await sql<{ id: string }[]>`
        insert into "Applied_Bookings".bookings (
          name, email, date, time, notes, manage_token, status
        ) values (
          ${leadRow.name}, ${leadRow.email},
          ${date}::date, ${time}::time, ${notes},
          ${manageToken}, 'confirmed'
        )
        returning id
      `;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        return fail("slot_taken", "Someone just took that time. Pick another and we are set.");
      }
      throw err;
    }

    const bookingId = inserted[0].id;
    const startsAtIso = new Date(startMs).toISOString();
    const endsAtIso = new Date(endMs).toISOString();

    let meetUrl: string | null = null;
    let googleEventId: string | null = null;
    try {
      const created = await createMeet({
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        lead: leadRow,
        bookingId,
      });
      meetUrl = created?.meetUrl ?? null;
      googleEventId = created?.eventId ?? null;
    } catch (err) {
      console.error("Google Calendar error", err);
    }

    await sql`
      update "Applied_Bookings".bookings
      set
        meet_url = ${meetUrl},
        manage_token = ${manageToken},
        google_event_id = ${googleEventId},
        status = 'confirmed'
      where id = ${bookingId}::uuid
    `;

    return {
      ok: true as const,
      bookingId,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      meetUrl,
      manageToken,
    };
  } finally {
    await sql.end({ timeout: 2 });
  }
}
