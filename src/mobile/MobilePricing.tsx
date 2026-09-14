import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { sectionVariants, itemVariants } from "../lib/animations";
import { PLANS } from "../content/plans";
import BookCallButton from "../components/ui/BookCallButton";

export default function MobilePricing() {
  return (
    <section id="pricing" className="relative overflow-x-clip bg-background py-16">
      <div aria-hidden className="section-dots" />
      <div className="relative mx-auto max-w-[480px] px-5">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col items-center text-center"
        >
          <motion.p variants={itemVariants} className="mb-2 font-mono-label text-[11px] text-primary">
            Pricing
          </motion.p>
          <motion.h2 variants={itemVariants} className="text-[1.75rem] leading-[1.15]">
            Ways to work with us.
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-3 max-w-[34ch] text-[16px] text-muted-foreground"
          >
            Three packages. Every one includes six months of servicing after we
            ship.
          </motion.p>
        </motion.div>
      </div>

      <div className="mobile-plan-scroll mt-10">
        <div className="mobile-plan-track">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`mobile-plan-card flex flex-col rounded-2xl border bg-card p-6 text-left soft-shadow ${
                plan.featured ? "border-primary ring-1 ring-primary/25" : "border-border"
              }`}
            >
              <span
                className={`mb-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono-label text-[10px] ${
                  plan.featured
                    ? "bg-primary/10 text-primary"
                    : "bg-[hsl(220_20%_94%)] text-muted-foreground"
                }`}
              >
                {plan.featured ? "Recommended" : plan.tag}
              </span>
              <h3 className="text-[18px] font-semibold">{plan.name}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">{plan.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-[14px] text-foreground/80"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-[hsl(147_66%_39%)]"
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
      </div>
    </section>
  );
}
