import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { EASE } from "../../lib/animations";
import {
  BOOKING_OPEN_EVENT,
  consumeBookingTrigger,
  focusBookingCalendar,
} from "../../lib/goto-booking";

const BookingCalendar = lazy(() => import("./BookingCalendar"));

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches,
  );

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
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPad = body.style.paddingRight;
    const gutter = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const nested = panelRef.current?.querySelector('[aria-expanded="true"]');
        if (nested) return;
        e.preventDefault();
        close();
        return;
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

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      shell?.removeAttribute("inert");
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPad;
      triggerRef.current?.focus();
    };
  }, [open, close]);

  const panelMotion = reduce
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0.16, ease: EASE },
      }
    : narrow
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          transition: { type: "spring" as const, bounce: 0, duration: 0.38 },
        }
      : {
          initial: { scale: 0.96, y: 10 },
          animate: { scale: 1, y: 0 },
          transition: { duration: 0.22, ease: EASE },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="booking-layer"
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.16 : 0.2, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Close booking"
            className="booking-glass-scrim absolute inset-0"
            onClick={close}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-booking-modal
            {...panelMotion}
            className="booking-glass-panel relative flex max-h-[94dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[22px] sm:max-h-[min(88vh,820px)] sm:rounded-[22px]"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="booking-glass-bar flex items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/robots/robot-overview.png"
                  alt=""
                  draggable={false}
                  className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16"
                />
                <div className="min-w-0">
                  <h2 id={titleId} className="text-[1.2rem] sm:text-[1.35rem]">
                    Book a call
                  </h2>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    30 minutes. Pick a time that works.
                  </p>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-[background-color,color,transform] duration-160 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="booking-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
              <Suspense fallback={<Skeleton />}>
                <BookingCalendar />
              </Suspense>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
