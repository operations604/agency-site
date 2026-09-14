// Windmill Bun script — path f/applied/booking_cancel
// HTTP: POST /api/r/applied/bookings/cancel  (wrap body ON)
// Marks the booking cancelled, cancels the Google event, frees the slot.
// Reads/writes "Applied_Bookings".bookings via f/Webull/supabase_postgres.

import * as wmill from "windmill-client";
import postgres from "postgres";

const CONFIG = {
  eventTitle: "Applied Systems intro call",
  eventTitles: ["Applied Systems intro call", "Applied Systems — intro call"],
  organizerName: "Applied Systems",
  supabaseResource: "f/Webull/supabase_postgres",
  googleResource: "f/applied/google_calendar",
  calendarId: "primary",
  businessTimezone: "America/New_York",
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

type CancelRequest = {
  bookingId?: string;
  manageToken?: string;
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

function fail(code: string, message: string) {
  return { ok: false as const, code, message };
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

async function cancelEvent(eventId: string) {
  const access = await googleToken();
  if (!access) return;
  await nameAsAppliedSystems(access);
  const calendar = encodeURIComponent(CONFIG.calendarId);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events/${encodeURIComponent(eventId)}` +
      `?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${access}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
        summary: CONFIG.eventTitle,
      }),
    },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error("Google Calendar cancel failed", res.status, await res.text());
  }
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
  }).formatToParts(new Date(utcMs));
  const out = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
  for (const p of parts) {
    if (p.type in out) {
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

function slotWindow(date: Date | string, time: string) {
  const ds =
    date instanceof Date
      ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
      : String(date).slice(0, 10);
  const [y, m, d] = ds.split("-").map(Number);
  const [hh, min] = String(time).split(":").map(Number);
  const start = zonedTimeToUtc(y, m, d, hh || 0, min || 0, CONFIG.businessTimezone);
  return {
    timeMin: new Date(start - 60_000).toISOString(),
    timeMax: new Date(start + 40 * 60_000).toISOString(),
  };
}

async function deleteEventBySlot(date: Date | string, time: string) {
  const access = await googleToken();
  if (!access) return;
  const { timeMin, timeMax } = slotWindow(date, time);
  const calendar = encodeURIComponent(CONFIG.calendarId);
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events`,
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  const res = await fetch(url.toString(), {
    headers: { authorization: `Bearer ${access}` },
  });
  if (!res.ok) return;
  const json = (await res.json()) as { items?: { id?: string; summary?: string }[] };
  const match = json.items?.find(
    (e) => e.id && e.summary && CONFIG.eventTitles.includes(e.summary),
  );
  if (match?.id) await cancelEvent(match.id);
}

export async function main(
  bookingId?: string,
  manageToken?: string,
  body?: CancelRequest,
) {
  const req = body ?? { bookingId, manageToken };
  const id = req.bookingId?.trim();
  const token = req.manageToken?.trim() ?? "";
  if (!id) return fail("not_found", "We could not find that booking.");

  const db = (await wmill.getResource(CONFIG.supabaseResource)) as Postgresql;
  const sql = sqlClient(db);

  try {
    const rows = await sql<
      {
        id: string;
        status: string | null;
        manage_token: string | null;
        google_event_id: string | null;
        date: Date | string;
        time: string;
      }[]
    >`
      select id, status, manage_token, google_event_id, date, time
      from "Applied_Bookings".bookings
      where id = ${id}::uuid
      limit 1
    `;
    const row = rows[0];
    if (!row) return fail("not_found", "We could not find that booking.");

    // New rows store manage_token. Older rows have none — the booking id is
    // enough to cancel from this confirmation screen.
    if (row.manage_token && row.manage_token !== token) {
      return fail("not_found", "We could not find that booking.");
    }
    if (row.status === "cancelled") {
      return fail("already_cancelled", "That call is already cancelled.");
    }

    await sql`
      update "Applied_Bookings".bookings
      set status = 'cancelled'
      where id = ${row.id}::uuid
    `;

    try {
      if (row.google_event_id) await cancelEvent(row.google_event_id);
      else await deleteEventBySlot(row.date, row.time);
    } catch (err) {
      console.error("Google Calendar cancel error", err);
    }

    return { ok: true as const };
  } finally {
    await sql.end({ timeout: 2 });
  }
}
