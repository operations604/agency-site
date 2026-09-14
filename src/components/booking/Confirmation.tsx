import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { EASE } from "../../lib/animations";
import type { BookingResult } from "../../lib/booking-api";
import { formatDayLong, formatTime, zoneAbbrev } from "../../lib/tz";
import BookingRobot from "./BookingRobot";

type Confirmed = Extract<BookingResult, { ok: true }>;

const EVENT_TITLE = "Applied Systems intro call";

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
    `ORGANIZER;CN=Applied Systems:mailto:hello@appliedsystems.com`,
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
  cancelled: boolean;
  cancelling: boolean;
  cancelError: string | null;
  onCancel: () => void;
  onBookAgain: () => void;
};

export default function Confirmation({
  booking,
  timezone,
  locale,
  email,
  isMock,
  cancelled,
  cancelling,
  cancelError,
  onCancel,
  onBookAgain,
}: Props) {
  const reduce = useReducedMotion();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const start = Date.parse(booking.startsAt);
  const end = Date.parse(booking.endsAt);

  const icsHref = useMemo(() => {
    const blob = new Blob([buildIcs(booking)], {
      type: "text/calendar;charset=utf-8",
    });
    return URL.createObjectURL(blob);
  }, [booking]);

  useEffect(() => () => URL.revokeObjectURL(icsHref), [icsHref]);

  if (cancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="mx-auto max-w-[520px] text-center"
      >
        <h3 className="text-[1.5rem]">This call is cancelled.</h3>
        <p className="mt-3 text-[15px] text-muted-foreground">
          The time is open on the calendar again. Cancelling from the invite
          email later does the same thing. It updates the booking and frees
          the slot.
        </p>
        <button
          type="button"
          onClick={onBookAgain}
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground transition-[background-color,box-shadow,transform] duration-160 ease-out hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Book another time
        </button>
      </motion.div>
    );
  }

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
            Demo booking. Nothing was sent.
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
          <span className="font-medium text-foreground">{email}</span>. Cancel
          from that email later and it updates the booking and frees the
          calendar slot, same as cancelling here.
        </p>
      )}

      <div className="mt-8 border-t border-border pt-6">
        {confirmingCancel ? (
          <div>
            <p className="text-[15px] text-foreground">
              Cancel this call? The time goes back on the calendar.
            </p>
            {isMock ? (
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                When invite email ships, cancelling from the email does the
                same: it marks the booking cancelled and opens the slot.
              </p>
            ) : (
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                The invite email has the same cancel link. Either path updates
                the booking and frees the slot.
              </p>
            )}
            {cancelError && (
              <p className="mt-3 text-[13px] font-medium text-foreground">
                {cancelError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {cancelling && (
                  <LoaderCircle size={16} className="boot-spin" aria-hidden />
                )}
                {cancelling ? "Cancelling…" : "Yes, cancel it"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelling}
                className="rounded-xl px-2 py-2.5 text-[15px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Keep the call
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="text-[14px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Cancel this call
          </button>
        )}
      </div>
    </motion.div>
  );
}
