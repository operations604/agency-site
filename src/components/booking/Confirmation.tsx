import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, TriangleAlert } from "lucide-react";
import { EASE } from "../../lib/animations";
import type { BookingResult } from "../../lib/booking-api";
import { formatDayLong, formatTime, zoneAbbrev } from "../../lib/tz";
import BookingRobot from "./BookingRobot";

type Confirmed = Extract<BookingResult, { ok: true }>;

const EVENT_TITLE = "Applied Systems — intro call";

function stampUtc(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildIcs(booking: Confirmed): string {
  const description = booking.meetUrl
    ? `Meeting link: ${booking.meetUrl}`
    : "Your meeting link will follow by email.";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Applied Systems//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.bookingId}@appliedsystems`,
    `DTSTAMP:${stampUtc(new Date().toISOString())}`,
    `DTSTART:${stampUtc(booking.startsAt)}`,
    `DTEND:${stampUtc(booking.endsAt)}`,
    `SUMMARY:${escapeIcs(EVENT_TITLE)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    ...(booking.meetUrl ? [`URL:${escapeIcs(booking.meetUrl)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleUrl(booking: Confirmed): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", EVENT_TITLE);
  url.searchParams.set(
    "dates",
    `${stampUtc(booking.startsAt)}/${stampUtc(booking.endsAt)}`,
  );
  if (booking.meetUrl) {
    url.searchParams.set("details", `Meeting link: ${booking.meetUrl}`);
    url.searchParams.set("location", booking.meetUrl);
  }
  return url.toString();
}

function outlookUrl(booking: Confirmed): string {
  const url = new URL(
    "https://outlook.live.com/calendar/0/deeplink/compose",
  );
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", EVENT_TITLE);
  url.searchParams.set("startdt", booking.startsAt);
  url.searchParams.set("enddt", booking.endsAt);
  if (booking.meetUrl) {
    url.searchParams.set("body", `Meeting link: ${booking.meetUrl}`);
    url.searchParams.set("location", booking.meetUrl);
  }
  return url.toString();
}

const actionClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/70 px-3.5 py-2 text-[14px] font-medium text-foreground transition-colors hover:border-foreground/25 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Props = {
  booking: Confirmed;
  timezone: string;
  locale: string;
  email: string;
  /** True while the mock adapter is the implementation. */
  isMock: boolean;
};

export default function Confirmation({
  booking,
  timezone,
  locale,
  email,
  isMock,
}: Props) {
  const reduce = useReducedMotion();

  const start = Date.parse(booking.startsAt);
  const end = Date.parse(booking.endsAt);

  const icsHref = useMemo(() => {
    const blob = new Blob([buildIcs(booking)], {
      type: "text/calendar;charset=utf-8",
    });
    return URL.createObjectURL(blob);
  }, [booking]);

  useEffect(() => () => URL.revokeObjectURL(icsHref), [icsHref]);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="mx-auto max-w-[520px] text-center"
    >
      <BookingRobot pose="complete" className="mx-auto h-[120px] w-[120px]" />

      <h3 className="mt-3 text-[1.5rem]">You're booked.</h3>

      <p className="font-mono-label mt-4 text-[13px] text-foreground">
        {formatDayLong(start, timezone, locale)}
      </p>
      <p className="mt-1 font-mono text-[15px] font-medium tabular-nums text-foreground">
        {formatTime(start, timezone, locale)} – {formatTime(end, timezone, locale)}{" "}
        <span className="text-muted-foreground">
          {zoneAbbrev(start, timezone, locale)}
        </span>
      </p>

      <div className="mt-7">
        <p className="font-mono-label text-[11px] text-muted-foreground">
          Add to calendar
        </p>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <a
            href={icsHref}
            download="applied-systems-call.ics"
            className={actionClass}
          >
            <Download size={14} aria-hidden /> .ics
          </a>
          <a
            href={googleUrl(booking)}
            target="_blank"
            rel="noreferrer noopener"
            className={actionClass}
          >
            <ExternalLink size={14} aria-hidden /> Google
          </a>
          <a
            href={outlookUrl(booking)}
            target="_blank"
            rel="noreferrer noopener"
            className={actionClass}
          >
            <ExternalLink size={14} aria-hidden /> Outlook
          </a>
        </div>
      </div>

      {isMock ? (
        <div className="mt-8 rounded-xl border border-border bg-muted/70 px-4 py-3 text-left">
          <p className="flex items-start gap-2 text-[14px] font-semibold text-foreground">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
            Demo booking — nothing was sent
          </p>
          <p className="mt-1 pl-[23px] text-[13px] leading-[1.6] text-muted-foreground">
            This site is running the phase 1 mock adapter. The booking is saved
            in this browser only: no email, no calendar invite, and no record on
            our side. Booking reference{" "}
            <span className="font-mono">{booking.bookingId}</span>.
          </p>
        </div>
      ) : (
        <p className="mt-8 text-[15px] text-muted-foreground">
          A calendar invite is on its way to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      )}
    </motion.div>
  );
}
