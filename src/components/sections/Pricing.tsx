import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { sectionVariants, itemVariants } from "../../lib/animations";
import BookCallButton from "../ui/BookCallButton";

type Plan = {
  name: string;
  tag: string;
  desc: string;
  points: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Automation build",
    tag: "One process",
    desc: "One process, scoped and delivered. A fixed plan, a fixed price, and a delivery date before we start.",
    points: [
      "One process automated end to end",
      "Fixed fee, fixed date",
      "Built on your real data",
      "Team training included",
    ],
  },
  {
    name: "CRM bundle",
    tag: "Sales & follow-up",
    desc: "Every lead captured, scored, and followed up without anyone touching a spreadsheet. Your CRM stays clean on its own.",
    points: [
      "Lead intake from forms, email, and ads",
      "Auto-qualification and routing",
      "Follow-up that stops when they reply",
      "Pipeline report every Monday",
      "HubSpot, Salesforce, Pipedrive, or custom",
    ],
  },
  {
    name: "Finance ops bundle",
    tag: "Invoices & AP",
    desc: "Invoices read, coded, matched, and filed into your books the moment they land. Approvals happen in Slack, not inboxes.",
    points: [
      "Invoice and receipt extraction",
      "Vendor matching and GL coding",
      "Approval flow with audit trail",
      "QuickBooks or Xero sync",
      "Month-end close checklist",
    ],
  },
  {
    name: "File management system",
    tag: "Documents",
    desc: "Every file named, sorted, tagged, and findable. Contracts, receipts, and client docs land where they belong the second they arrive.",
    points: [
      "Auto-naming and folder rules",
      "Reads PDFs, scans, and emails",
      "Client and project structures",
      "Retention and version control",
      "Google Drive, SharePoint, or Dropbox",
    ],
  },
  {
    name: "AI inbox agent",
    tag: "Support & scheduling",
    desc: "An agent that answers the repeat questions, books the appointments, and hands the rest to a person with full context.",
    points: [
      "Email, SMS, and web chat",
      "Books and reschedules on your calendar",
      "Escalates with a summary",
      "Trained on your policies",
      "Human takeover at any point",
    ],
  },
  {
    name: "Full custom system",
    tag: "Everything, connected",
    desc: "Multiple processes tied into one platform built around how your company actually runs. We build it, host it, and keep it running.",
    points: [
      "Any of the bundles, combined",
      "One custom platform and dashboard",
      "Maintenance retainer included",
      "Hosting and monitoring",
      "Changes as you grow",
      "Priority support",
    ],
    featured: true,
  },
];

const CARD = 340;
const GAP = 16;

export default function Pricing() {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = rail.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const nudge = (dir: 1 | -1) =>
    rail.current?.scrollBy({ left: dir * (CARD + GAP) * 2, behavior: "smooth" });

  return (
    <section id="pricing" className="relative overflow-hidden bg-background py-20 sm:py-28">
      <div aria-hidden className="section-dots" />
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <motion.p variants={itemVariants} className="mb-2 font-mono-label text-[11px] text-primary">
              Pricing
            </motion.p>
            <motion.h2 variants={itemVariants} className="text-[1.75rem] sm:text-[2.5rem]">
              Ways to work with us.
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mt-4 max-w-[560px] text-[17px] text-muted-foreground"
            >
              Start with one bundle or combine them. Every full system includes
              a maintenance retainer, so we keep it running as your business
              changes.
            </motion.p>
          </div>
          <motion.div variants={itemVariants} className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={edge.start}
              aria-label="Previous bundles"
              className="hairline grid h-10 w-10 place-items-center rounded-full bg-card text-foreground transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={edge.end}
              aria-label="Next bundles"
              className="hairline grid h-10 w-10 place-items-center rounded-full bg-card text-foreground transition hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground"
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* One row. Bleeds to the viewport edge; the inner padding lines the
          first card up with the heading. */}
      <div className="relative mt-12">
        <div
          ref={rail}
          className="rail flex gap-4 overflow-x-auto px-5 pb-4 pt-1 sm:px-8"
          style={{
            scrollPaddingLeft: "max(1.25rem, calc((100vw - 1200px) / 2 + 2rem))",
            paddingLeft: "max(1.25rem, calc((100vw - 1200px) / 2 + 2rem))",
            paddingRight: "max(1.25rem, calc((100vw - 1200px) / 2 + 2rem))",
          }}
        >
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex shrink-0 snap-start flex-col rounded-2xl border bg-card p-7 soft-shadow transition-shadow hover:soft-shadow-lg ${
                plan.featured ? "border-primary ring-1 ring-primary/25" : "border-border"
              }`}
              style={{ width: CARD }}
            >
              <span
                className={`mb-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono-label text-[10px] ${
                  plan.featured
                    ? "bg-primary/10 text-primary"
                    : "bg-[hsl(220_20%_94%)] text-muted-foreground"
                }`}
              >
                {plan.featured ? "Includes maintenance" : plan.tag}
              </span>
              <h3 className="text-[20px] font-semibold">{plan.name}</h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-muted-foreground">{plan.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-[15px] text-foreground/80"
                  >
                    <Check
                      size={16}
                      className="mt-1 shrink-0 text-[hsl(147_66%_39%)]"
                      strokeWidth={2.5}
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <BookCallButton
                variant={plan.featured ? "solid" : "ghost"}
                className="mt-6 w-full"
              >
                Book a call
              </BookCallButton>
            </article>
          ))}
        </div>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent transition-opacity ${
            edge.end ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent transition-opacity ${
            edge.start ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>
    </section>
  );
}
