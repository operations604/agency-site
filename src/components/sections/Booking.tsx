import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sectionVariants, itemVariants } from "../../lib/animations";
import { CALENDLY_URL, loadCalendly } from "../../lib/calendly";

function Skeleton() {
  // Unboxed placeholder mimicking the calendar-only widget, sitting directly
  // on the page background so nothing looks like a card while loading.
  return (
    <div className="absolute inset-0 z-10 bg-background pt-10">
      <div className="mx-auto max-w-[420px] px-6">
        <div className="mx-auto h-6 w-52 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto mt-8 h-5 w-36 animate-pulse rounded bg-muted/70" />
        <div className="mt-6 grid grid-cols-7 gap-3">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-full bg-muted/60"
            />
          ))}
        </div>
        <div className="mx-auto mt-8 h-4 w-40 animate-pulse rounded bg-muted/70" />
      </div>
    </div>
  );
}

export default function Booking() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Don't pull in Calendly's widget until the visitor scrolls close to the
  // booking section. Keeps the heavy third-party script off the initial load.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport) return;
    let cancelled = false;
    let pollId: number | undefined;
    let timeoutId: number | undefined;

    const reveal = () => {
      if (!cancelled) setLoaded(true);
    };

    loadCalendly()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container) return;

        // StrictMode re-runs this effect in dev; clear any widget from the
        // previous run so we never stack two iframes.
        container.replaceChildren();
        try {
          // hide_event_type_details: the section heading already introduces
          // the call, so skip Calendly's own header block.
          // background_color: match the page background (hsl(220 40% 98%)).
          // resize: let Calendly size the iframe to its content so nothing
          // scrolls or gets cut off inside the widget.
          window.Calendly!.initInlineWidget({
            url: `${CALENDLY_URL}?primary_color=2563EB&hide_gdpr_banner=1&hide_event_type_details=1&background_color=f7f8fc`,
            parentElement: container,
            resize: true,
          });
        } catch {
          reveal();
          return;
        }

        // Calendly appends its iframe synchronously, so it should exist
        // already; poll briefly as a safety net, and reveal once the iframe
        // has actually loaded its content.
        const hookIframe = (iframe: HTMLIFrameElement) => {
          iframe.addEventListener("load", reveal, { once: true });
        };
        const iframe = container.querySelector("iframe");
        if (iframe) {
          hookIframe(iframe);
        } else {
          pollId = window.setInterval(() => {
            const found = containerRef.current?.querySelector("iframe");
            if (found) {
              window.clearInterval(pollId);
              hookIframe(found);
            }
          }, 100);
        }
        // Last-resort fallback: never leave the skeleton up forever.
        timeoutId = window.setTimeout(reveal, 4000);
      })
      .catch(reveal);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
    };
  }, [nearViewport]);

  return (
    <section
      id="book"
      ref={sectionRef}
      className="bg-background py-20 sm:py-28"
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
        {/* No card chrome: the widget sits directly on the page background.
            Kept narrow on purpose — below ~650px Calendly renders its
            borderless layout, so the widget has no internal card frame. */}
        <motion.div
          variants={itemVariants}
          className="relative mx-auto mt-6 w-full max-w-[640px]"
        >
          {!loaded && <Skeleton />}
          {/* Always visible so Calendly measures a real width at init time;
              the skeleton overlays it until the iframe finishes loading.
              With resize:true Calendly sets the iframe height to fit its
              content, so the min-height (skeleton room) is only kept while
              loading to avoid an empty gap afterwards. */}
          <div
            ref={containerRef}
            className={loaded ? "w-full" : "min-h-[700px] w-full"}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
