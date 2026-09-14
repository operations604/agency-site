import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  BOOKING_OPEN_EVENT,
  consumeBookingTrigger,
  focusBookingCalendar,
} from "../../lib/goto-booking";

const BookingCalendar = lazy(() => import("./BookingCalendar"));

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

function scrollerFrom(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>(
        ".booking-modal-scroll, .booking-times, .liquid-glass-menu",
      )
    : null;
}

function freezePinnedStages() {
  const restores: Array<() => void> = [];
  const nodes = document.querySelectorAll<HTMLElement>("#what-we-build .sticky");
  for (const el of nodes) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 48 || rect.top > window.innerHeight - 48) continue;
    const prev = {
      position: el.style.position,
      top: el.style.top,
      left: el.style.left,
      width: el.style.width,
      height: el.style.height,
      zIndex: el.style.zIndex,
    };
    el.style.position = "fixed";
    el.style.top = `${Math.round(rect.top)}px`;
    el.style.left = `${Math.round(rect.left)}px`;
    el.style.width = `${Math.round(rect.width)}px`;
    el.style.height = `${Math.round(rect.height)}px`;
    el.style.zIndex = "40";
    restores.push(() => {
      el.style.position = prev.position;
      el.style.top = prev.top;
      el.style.left = prev.left;
      el.style.width = prev.width;
      el.style.height = prev.height;
      el.style.zIndex = prev.zIndex;
    });
  }
  return () => restores.forEach((fn) => fn());
}

function Skeleton() {
  return (
    <div aria-hidden className="grid gap-8 min-[900px]:grid-cols-[1fr_288px] min-[900px]:gap-0">
      <div className="min-[900px]:pr-8">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
          <div className="flex gap-1">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="mx-auto h-3 w-7 animate-pulse rounded bg-muted/70"
            />
          ))}
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="mx-auto my-0.5 h-10 w-10 animate-pulse rounded-full bg-muted/60"
            />
          ))}
        </div>
        <div className="mt-5 h-5 w-52 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="border-t border-border pt-6 min-[900px]:border-l min-[900px]:border-t-0 min-[900px]:pl-8 min-[900px]:pt-0">
        <div className="h-6 w-44 animate-pulse rounded-md bg-muted" />
        <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-muted/70" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BookingModal() {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const openModal = useCallback(() => {
    const remembered = consumeBookingTrigger();
    const active = document.activeElement;
    triggerRef.current =
      remembered ??
      (active instanceof HTMLElement && active !== document.body ? active : null);
    setOpen(true);
    focusBookingCalendar();
  }, []);

  useEffect(() => {
    const onOpen = () => openModal();
    window.addEventListener(BOOKING_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(BOOKING_OPEN_EVENT, onOpen);
  }, [openModal]);

  useEffect(() => {
    if (!open) return;

    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");
    const thaw = freezePinnedStages();

    const onWheel = (e: WheelEvent) => {
      const scroller = scrollerFrom(e.target);
      if (!scroller) {
        e.preventDefault();
        return;
      }
      const top = scroller.scrollTop;
      const max = scroller.scrollHeight - scroller.clientHeight;
      if ((e.deltaY < 0 && top <= 0) || (e.deltaY > 0 && top >= max - 1)) {
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!scrollerFrom(e.target)) e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const nested = panelRef.current?.querySelector('[aria-expanded="true"]');
        if (nested) return;
        e.preventDefault();
        close();
        return;
      }
      if (SCROLL_KEYS.has(e.key) && !scrollerFrom(e.target)) {
        const tag = e.target instanceof HTMLElement ? e.target.tagName : "";
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
        }
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("keydown", onKey);
      shell?.removeAttribute("inert");
      thaw();
      triggerRef.current?.focus();
    };
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div className="booking-liquid-layer">
      <button
        type="button"
        aria-label="Close booking"
        className="booking-liquid-catcher"
        onClick={close}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-booking-modal
        className="booking-liquid-frame"
      >
        <div className="booking-liquid-material" aria-hidden />
        <div className="booking-liquid-shine" aria-hidden />

        <div className="booking-glass-bar relative z-10 flex items-center justify-between gap-3 px-4 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/robots/robot-overview.png"
              alt=""
              draggable={false}
              className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
            />
            <div className="min-w-0">
              <h2 id={titleId} className="text-[1.02rem] leading-tight sm:text-[1.08rem]">
                Book a call
              </h2>
              <p className="mt-px text-[12px] leading-tight text-muted-foreground">
                30 minutes. Pick a time that works.
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-[color,transform] duration-160 ease-out hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="booking-modal-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <Suspense fallback={<Skeleton />}>
            <BookingCalendar />
          </Suspense>
        </div>
      </div>
    </div>,
    document.body,
  );
}
