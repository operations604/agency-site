import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarClock, Clock, TriangleAlert } from "lucide-react";
import { EASE } from "../../lib/animations";
import {
  bookingApi,
  bookingApiIsMock,
  type BookingResult,
  type Slot,
} from "../../lib/booking-api";
import { buildBookingContext } from "../../lib/visitor-context";
import {
  compareDayKeys,
  dayKey,
  dayKeyNoonUtc,
  formatDayLong,
  formatTime,
  localTimeZone,
  localeTag,
  zoneAbbrev,
} from "../../lib/tz";
import Confirmation from "./Confirmation";
import DetailsForm, { type FormBanner } from "./DetailsForm";
import MonthGrid from "./MonthGrid";
import TimeList from "./TimeList";
import TimezoneSelect from "./TimezoneSelect";
import { EMPTY_LEAD, STEP_LABELS, type BookingStep, type LeadForm } from "./types";
import { useAvailability } from "./useAvailability";

const KEY_ZONE = "UTC";
const DAY_MS = 24 * 60 * 60 * 1000;
const CONTACT_EMAIL = "hello@appliedsystems.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STEPS: BookingStep[] = [1, 2, 3];

function validate(lead: LeadForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!lead.name.trim()) errors.name = "Tell us who we are meeting.";
  if (!lead.email.trim()) errors.email = "We need an email to send the invite.";
  else if (!EMAIL_RE.test(lead.email.trim())) errors.email = "That email looks off.";
  if (!lead.company.trim()) errors.company = "Which company is this for?";
  if (!lead.painPoint.trim()) {
    errors.painPoint = "A sentence is plenty — what is eating your time?";
  }
  return errors;
}

function toLeadPayload(lead: LeadForm) {
  return {
    name: lead.name.trim(),
    email: lead.email.trim(),
    company: lead.company.trim(),
    painPoint: lead.painPoint.trim(),
  };
}

export default function BookingCalendar() {
  const reduce = useReducedMotion();
  const [locale] = useState(() => localeTag());
  const [timezone, setTimezone] = useState(() => localTimeZone());
  const [step, setStep] = useState<BookingStep>(1);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [focusTimesNonce, setFocusTimesNonce] = useState(0);

  const [lead, setLead] = useState<LeadForm>(EMPTY_LEAD);
  const [honeypot, setHoneypot] = useState("");
  // Time-to-submit: phase 2's server reads it to spot bots that fill instantly.
  const [formStartedAt] = useState(() => Date.now());

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<FormBanner | null>(null);
  const [confirmed, setConfirmed] =
    useState<Extract<BookingResult, { ok: true }> | null>(null);

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstStepRender = useRef(true);

  const availability = useAvailability(timezone);
  const { byDay, openDayKeys, status, reload, dropSlot } = availability;

  // Captured once: recomputing it every render makes the memo deps below
  // change on every pass, and "today" must not drift mid-session anyway.
  const [now] = useState(() => Date.now());
  const todayKey = useMemo(() => dayKey(now, timezone), [now, timezone]);
  const maxKey = useMemo(
    () => dayKey(now + availability.windowDays * DAY_MS, timezone),
    [now, timezone, availability.windowDays],
  );

  const loading = status === "loading";
  const rangeEmpty = status === "ready" && openDayKeys.length === 0;

  // Land on the first day that actually has something open.
  useEffect(() => {
    if (selectedDayKey || openDayKeys.length === 0) return;
    setSelectedDayKey(openDayKeys[0]);
  }, [openDayKeys, selectedDayKey]);

  // Step changes move focus to the new heading so the keyboard path continues
  // where the eye does. Skipped on first render so mounting never steals focus.
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);

  const daySlots = selectedDayKey ? (byDay.get(selectedDayKey) ?? []) : [];

  const nextOpenKey = useMemo(() => {
    if (!selectedDayKey) return openDayKeys[0] ?? null;
    return (
      openDayKeys.find((k) => compareDayKeys(k, selectedDayKey) > 0) ??
      openDayKeys.find((k) => k !== selectedDayKey) ??
      null
    );
  }, [openDayKeys, selectedDayKey]);

  const patchLead = useCallback((patch: Partial<LeadForm>) => {
    setLead((prev) => ({ ...prev, ...patch }));
  }, []);

  const pickSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setBanner(null);
    setStep(2);
  };

  const submit = async () => {
    if (!selectedSlot) {
      setBanner({
        title: "Pick a time first.",
        body: "Choose an open slot and we will take your details.",
        onRetry: () => setStep(1),
        retryLabel: "Pick a time",
      });
      return;
    }

    const errors = validate(lead);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setBanner(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setBanner(null);

    try {
      const result = await bookingApi.book({
        startsAt: selectedSlot.startsAt,
        timezone,
        locale,
        lead: toLeadPayload(lead),
        context: buildBookingContext(honeypot, formStartedAt),
      });

      if (result.ok) {
        setConfirmed(result);
        setStep(3);
        return;
      }

      if (result.code === "slot_taken") {
        // Drop it locally so the grid updates immediately, then refresh from
        // the source. Every field the visitor typed stays exactly as it is.
        dropSlot(selectedSlot.startsAt);
        reload();
        setSelectedSlot(null);
        setBanner({
          title: "That time just went.",
          body: `${result.message} Your answers are saved — pick another time and we will send it straight through.`,
          onRetry: () => setStep(1),
          retryLabel: "Pick another time",
        });
        return;
      }

      if (result.code === "invalid") {
        setFieldErrors(result.fieldErrors ?? {});
        setBanner({ title: "Almost there.", body: result.message });
        return;
      }

      setBanner({
        title:
          result.code === "rate_limited"
            ? "Too many tries."
            : "That did not go through.",
        body: `${result.message} Your answers are still here.`,
        onRetry: () => void submit(),
      });
    } catch {
      // Only transport failures throw. Keep every field and offer a retry.
      setBanner({
        title: "We could not reach the server.",
        body: "Check your connection and try again — your answers are still here.",
        onRetry: () => void submit(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Enter-only, deliberately. AnimatePresence mode="wait" deadlocks here: the
  // outgoing step contains variant-orchestrated children (the month grid, the
  // time list) whose exit never resolves, so the incoming step never mounts and
  // the flow dead-ends on step 1. Animating only the entering step is
  // deterministic, and the step still fades in with a small y-offset.
  const stepTransition = {
    initial: { opacity: 0, y: reduce ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.24, ease: EASE },
  };

  const pinnedWhen = selectedSlot ? (
    <span className="font-mono tabular-nums">
      {formatTime(Date.parse(selectedSlot.startsAt), timezone, locale)}
    </span>
  ) : null;

  return (
    <div
      data-booking-focus
      tabIndex={-1}
      aria-label="Book a call"
      className="w-full text-left focus:outline-none"
    >
      {/* Step changes are announced without moving anyone's reading position. */}
      <p aria-live="polite" className="sr-only">
        {`Step ${step} of 3, ${STEP_LABELS[step]}`}
      </p>

      <ol className="font-mono-label flex items-center justify-center gap-x-2 text-[10px] sm:gap-x-3 sm:text-[11px]">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span
              aria-current={s === step ? "step" : undefined}
              className={
                s === step
                  ? "text-foreground"
                  : s < step
                    ? "text-primary"
                    : "text-muted-foreground/60"
              }
            >
              {String(s).padStart(2, "0")} {STEP_LABELS[s]}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="text-muted-foreground/35">
                ·
              </span>
            )}
          </li>
        ))}
      </ol>

        {step === 1 && (
          <motion.div key="step-1" {...stepTransition} className="mt-8">
            <h3 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
              Pick a time
            </h3>

            {status === "error" ? (
              <div className="mx-auto max-w-[460px] py-10 text-center">
                <TriangleAlert
                  size={20}
                  className="mx-auto text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 text-[15px] text-foreground">
                  {availability.error}
                </p>
                <button
                  type="button"
                  onClick={reload}
                  className="mt-4 rounded-xl border border-border bg-card px-5 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Try again
                </button>
              </div>
            ) : rangeEmpty ? (
              <div className="mx-auto max-w-[460px] py-10 text-center">
                <CalendarClock
                  size={20}
                  className="mx-auto text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 text-[15px] text-foreground">
                  Nothing open in the next {availability.windowDays} days.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Booking a call")}`}
                  className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Email us instead
                </a>
              </div>
            ) : (
              <div className="grid gap-8 min-[900px]:grid-cols-[1fr_288px] min-[900px]:gap-0">
                <div className="min-[900px]:pr-8">
                  <MonthGrid
                    locale={locale}
                    byDay={byDay}
                    selectedKey={selectedDayKey}
                    onSelect={(key) => {
                      setSelectedDayKey(key);
                      setSelectedSlot(null);
                    }}
                    todayKey={todayKey}
                    minKey={todayKey}
                    maxKey={maxKey}
                    refreshing={loading}
                  />
                  <div className="mt-5 flex justify-start">
                    <TimezoneSelect value={timezone} onChange={setTimezone} />
                  </div>
                </div>

                {/* Hairline divider on the two-pane layout; on narrow screens
                    the times simply slide up underneath the grid. */}
                <motion.div
                  key={selectedDayKey ?? "none"}
                  initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: EASE }}
                  className="pt-8 min-[900px]:border-l min-[900px]:border-border min-[900px]:pl-8 min-[900px]:pt-0"
                >
                  <TimeList
                    dayKey={selectedDayKey}
                    slots={daySlots}
                    selectedStartsAt={selectedSlot?.startsAt ?? null}
                    onSelect={pickSlot}
                    timezone={timezone}
                    locale={locale}
                    loading={loading}
                    slotMinutes={availability.result?.slotMinutes ?? 30}
                    nextOpenKey={nextOpenKey}
                    focusFirstNonce={focusTimesNonce}
                    onJump={(key) => {
                      setSelectedDayKey(key);
                      setSelectedSlot(null);
                      setFocusTimesNonce((n) => n + 1);
                    }}
                  />
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step-2" {...stepTransition} className="mt-8">
            <h3 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
              Your details
            </h3>

            <div className="mx-auto max-w-[620px]">
              {/* Pinned so nobody loses their place while filling this in. */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="shrink-0 text-primary" aria-hidden />
                  <p className="text-[15px] text-foreground">
                    {selectedDayKey && (
                      <span className="font-medium">
                        {formatDayLong(
                          dayKeyNoonUtc(selectedDayKey),
                          KEY_ZONE,
                          locale,
                        )}
                      </span>
                    )}
                    {selectedSlot ? (
                      <>
                        {" · "}
                        {pinnedWhen}{" "}
                        <span className="text-muted-foreground">
                          {zoneAbbrev(
                            Date.parse(selectedSlot.startsAt),
                            timezone,
                            locale,
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {" · no time selected"}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg text-[14px] font-medium text-primary transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowLeft size={14} aria-hidden /> Change
                </button>
              </div>

              <div className="mt-6">
                <DetailsForm
                  value={lead}
                  onChange={patchLead}
                  onSubmit={() => void submit()}
                  onBack={() => setStep(1)}
                  submitting={submitting}
                  fieldErrors={fieldErrors}
                  banner={banner}
                  honeypot={honeypot}
                  onHoneypotChange={setHoneypot}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && confirmed && (
          <motion.div key="step-3" {...stepTransition} className="mt-10">
            <h3 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
              Confirmed
            </h3>
            <Confirmation
              booking={confirmed}
              timezone={timezone}
              locale={locale}
              email={lead.email.trim()}
              isMock={bookingApiIsMock}
            />
          </motion.div>
        )}
    </div>
  );
}
