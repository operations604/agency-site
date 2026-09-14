// Shared behaviour for every "Book a call" control: open the booking popup
// and land focus inside the calendar once it has rendered.

export const BOOKING_OPEN_EVENT = "applied:booking-open";

const FOCUS_DEADLINE_MS = 2500;

let lastTrigger: HTMLElement | null = null;

export function consumeBookingTrigger(): HTMLElement | null {
  const el = lastTrigger;
  lastTrigger = null;
  return el;
}

/** Poll until the popup calendar has rendered, then focus its active day. */
export function focusBookingCalendar() {
  const deadline = Date.now() + FOCUS_DEADLINE_MS;
  const tick = () => {
    const day = document.querySelector<HTMLElement>(
      '[data-booking-modal] [data-day][tabindex="0"]',
    );
    if (day) {
      day.focus({ preventScroll: true });
      return;
    }
    if (Date.now() < deadline) {
      requestAnimationFrame(tick);
      return;
    }
    document
      .querySelector<HTMLElement>("[data-booking-modal] [data-booking-focus]")
      ?.focus({ preventScroll: true });
  };
  requestAnimationFrame(tick);
}

export function goToBooking() {
  const active = document.activeElement;
  lastTrigger =
    active instanceof HTMLElement && active !== document.body ? active : null;
  window.dispatchEvent(new CustomEvent(BOOKING_OPEN_EVENT));
  focusBookingCalendar();
}
