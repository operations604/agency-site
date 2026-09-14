import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "../../lib/animations";
import { STAGE_ORDER, STATUS_ROWS, type DemoStage } from "../../lib/demo-stage";

type Props = {
  stage: DemoStage;
  statusReady: boolean;
  reduced: boolean;
  className?: string;
};

export default function AutomationStatus({
  stage,
  statusReady,
  reduced,
  className = "",
}: Props) {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const latest =
    statusReady || stage === "complete" ? STATUS_ROWS[stageIndex] : null;

  return (
    <div
      className={`hairline rounded-xl bg-white/20 p-2 backdrop-blur-sm ${className}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <img src="/favicon.svg?v=4" alt="" className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-tight text-foreground">
            Automation
          </div>
          <div className="text-[9px] text-muted-foreground">Applied is on it</div>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {STATUS_ROWS.map((row, i) => {
          const done =
            i < stageIndex || (i === stageIndex && (statusReady || stage === "complete"));
          const active = i === stageIndex && stage !== "complete";
          return (
            <li
              key={row.stage}
              className={`flex items-start gap-1.5 rounded-md px-1 py-0.5 ${
                active ? "bg-primary/[0.08]" : ""
              }`}
            >
              <span
                className={`mt-px grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                  done
                    ? "bg-[hsl(147_66%_39%)] text-white"
                    : "border border-border/70 bg-transparent"
                }`}
              >
                {done && <Check size={9} strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium leading-tight text-foreground">
                  {row.label}
                </span>
                <motion.span
                  initial={false}
                  animate={{ opacity: done ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
                  className="block truncate text-[9px] leading-tight text-muted-foreground"
                >
                  {row.detail}
                </motion.span>
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {latest ? `${latest.label}. ${latest.detail}.` : ""}
      </div>
    </div>
  );
}
