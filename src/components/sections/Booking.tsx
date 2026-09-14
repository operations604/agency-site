import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sectionVariants, itemVariants } from "../../lib/animations";
import { BOOKING_OPEN_EVENT } from "../../lib/goto-booking";

// The calendar is the heaviest thing below the fold, so it stays out of the
// initial bundle and mounts when the section nears the viewport.
const BookingCalendar = lazy(() => import("../booking/BookingCalendar"));

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

export default function Booking() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);

    const open = () => {
      setMounted(true);
      io.disconnect();
    };
    window.addEventListener(BOOKING_OPEN_EVENT, open);

    return () => {
      io.disconnect();
      window.removeEventListener(BOOKING_OPEN_EVENT, open);
    };
  }, []);

  return (
    <section
      id="book"
      ref={sectionRef}
      className="relative bg-background py-20 sm:py-28"
    >
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-[1000px] px-5 text-center sm:px-8"
      >
        <motion.h2
          variants={itemVariants}
          className="text-[1.75rem] sm:text-[2.5rem]"
        >
          Tell us what is eating your time.
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-4 max-w-[520px] text-[17px] text-[hsl(222_10%_35%)]"
        >
          30 minutes. We will tell you what we can do for you to make more
          money.
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="booking-plate relative mx-auto mt-10 w-full max-w-[880px] overflow-hidden rounded-[22px] px-5 py-7 text-left sm:px-8 sm:py-8"
        >
          {mounted ? (
            <Suspense fallback={<Skeleton />}>
              <BookingCalendar />
            </Suspense>
          ) : (
            <Skeleton />
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
