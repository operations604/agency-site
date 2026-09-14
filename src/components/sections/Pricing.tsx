import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { sectionVariants, itemVariants } from "../../lib/animations";
import { PLANS } from "../../content/plans";
import BookCallButton from "../ui/BookCallButton";

export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-background py-20 sm:py-28">
      <div aria-hidden className="section-dots" />
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
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
            Three packages. Every one includes six months of servicing after we
            ship, so the system keeps pace as the week changes.
          </motion.p>
        </motion.div>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-2xl border bg-card p-7 soft-shadow transition-shadow hover:soft-shadow-lg ${
                plan.featured ? "border-primary ring-1 ring-primary/25 lg:py-8" : "border-border"
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
      </div>
    </section>
  );
}
