import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Check, FileText } from "lucide-react";

const INVOICES = [
  {
    vendor: "Brightline Supply Co",
    invoice: "INV-20488",
    amount: "$4,820.00",
    due: "Sep 19, 2026",
    job: "JOB-7731 Roofing",
  },
  {
    vendor: "Northgate Logistics",
    invoice: "INV-55921",
    amount: "$1,146.50",
    due: "Sep 23, 2026",
    job: "JOB-7740 Delivery",
  },
  {
    vendor: "Cascade Electrical",
    invoice: "INV-33120",
    amount: "$2,905.75",
    due: "Sep 28, 2026",
    job: "JOB-7755 Rewire",
  },
] as const;

const FIELDS = ["vendor", "invoice", "amount", "due", "job"] as const;
const CONFIDENCE = ["99%", "99%", "98%", "97%", "94%"];

function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let i = 0;
    setCount(0);
    const interval = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) clearInterval(interval);
    }, 32);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {text.slice(0, count)}
      <span
        className="ml-0.5 inline-block w-[1px] animate-pulse bg-[hsl(21_89%_54%)]"
        style={{ height: 14 }}
      />
    </span>
  );
}

export default function InvoiceExtraction() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const reduced = useReducedMotion();
  const [docIndex, setDocIndex] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(5);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    if (step < 5) {
      timer = setTimeout(() => setStep((s) => s + 1), 1050);
    } else {
      timer = setTimeout(() => {
        setStep(0);
        setDocIndex((d) => (d + 1) % INVOICES.length);
      }, 2300);
    }
    return () => clearTimeout(timer);
  }, [step, docIndex, inView, reduced]);

  const doc = INVOICES[docIndex];

  return (
    <div ref={ref} className="grid grid-cols-2 gap-0">
      <div
        className="relative flex flex-col border-r border-[hsl(38_21%_90%)] bg-[hsl(40_38%_97%)] p-5"
        style={{ minHeight: 360 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono-label text-[10px] text-[hsl(222_10%_45%)]">
            ap@yourcompany.com
          </span>
          <span className="rounded-full bg-[hsl(21_89%_54%/0.12)] px-2 py-0.5 font-mono-label text-[9px] text-[hsl(21_89%_42%)]">
            3 new
          </span>
        </div>
        <div className="relative mx-auto w-full max-w-[230px]">
          {[2, 1].map((depth) => (
            <div
              key={depth}
              className="absolute inset-x-0 rounded-xl border border-[hsl(38_21%_90%)] bg-white"
              style={{
                top: depth * 10,
                transform: `translateX(${depth * 6}px) scale(${1 - depth * 0.03})`,
                opacity: 0.5,
                zIndex: 0,
              }}
            />
          ))}
          <AnimatePresence mode="wait">
            <motion.div
              key={docIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28, x: 60 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 rounded-xl border border-[hsl(38_21%_90%)] bg-white p-4 soft-shadow"
            >
              <div className="mb-3 flex items-center gap-2 text-[hsl(222_10%_45%)]">
                <FileText size={14} />
                <span className="font-mono-label text-[10px]">invoice.pdf</span>
              </div>
              {/* Each highlight is anchored to its own document line so the
                  overlay always lines up, regardless of font metrics. */}
              <div className="space-y-2.5">
                {["w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-3/5"].map(
                  (width, i) => (
                    <div key={i} className="relative">
                      <div
                        className={`h-2 ${width} rounded bg-[hsl(38_21%_88%)]`}
                      />
                      <motion.div
                        className="absolute -inset-x-1 -top-[3px] h-[14px] rounded-md border-[1.5px] border-[hsl(21_89%_54%/0.7)] bg-[hsl(21_89%_54%/0.08)]"
                        initial={{ opacity: 0, scaleX: 0.85 }}
                        animate={{
                          opacity: step >= i ? 1 : 0,
                          scaleX: step >= i ? 1 : 0.85,
                        }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Queue: which documents are read, reading, waiting. */}
        <div className="mt-auto pt-5">
          <div className="mb-1.5 font-mono-label text-[9px] text-[hsl(222_10%_55%)]">Queue</div>
          <div className="divide-y divide-[hsl(38_21%_90%)] rounded-lg border border-[hsl(38_21%_90%)] bg-white">
            {INVOICES.map((inv, i) => {
              const state = i === docIndex ? "reading" : i < docIndex ? "filed" : "queued";
              return (
                <div key={inv.invoice} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
                  <FileText size={11} className="shrink-0 text-[hsl(222_10%_55%)]" />
                  <span className="flex-1 truncate font-medium text-[hsl(223_14%_10%)]">{inv.vendor}</span>
                  <span className="font-mono-label text-[9px] text-[hsl(222_10%_55%)]">{inv.amount}</span>
                  <span
                    className={`w-[52px] text-right font-mono-label text-[9px] ${
                      state === "reading"
                        ? "text-[hsl(21_89%_45%)]"
                        : state === "filed"
                          ? "text-[hsl(147_66%_30%)]"
                          : "text-[hsl(222_10%_60%)]"
                    }`}
                  >
                    {state.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-5" style={{ minHeight: 360 }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono-label text-[10px] text-[hsl(222_10%_45%)]">Extracted fields</span>
          <span className="flex items-center gap-1.5 font-mono-label text-[9px] text-[hsl(222_10%_50%)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(147_66%_39%)]" />
            QuickBooks · connected
          </span>
        </div>
        <div className="space-y-3">
          {FIELDS.map((field, i) => (
            <div
              key={field}
              className="border-b border-dashed border-[hsl(38_21%_90%)] pb-2"
            >
              <div className="flex items-center justify-between font-mono-label text-[9px] text-[hsl(222_10%_55%)]">
                <span>
                  {field
                    .replace("invoice", "invoice #")
                    .replace("due", "due date")
                    .replace("job", "job code")}
                </span>
                <span
                  className="text-[hsl(147_66%_34%)] transition-opacity duration-300"
                  style={{ opacity: step > i ? 1 : 0 }}
                >
                  {CONFIDENCE[i]}
                </span>
              </div>
              <div className="mt-0.5 text-[14px] font-medium text-[hsl(223_14%_10%)]">
                {step > i ? (
                  doc[field]
                ) : step === i ? (
                  <Typewriter text={doc[field]} />
                ) : (
                  <span className="text-[hsl(222_10%_75%)]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[hsl(147_66%_39%/0.12)] px-3 py-1.5"
            >
              <Check
                size={13}
                className="text-[hsl(147_66%_30%)]"
                strokeWidth={3}
              />
              <span className="font-mono-label text-[10px] text-[hsl(147_66%_28%)]">
                Filed to accounting
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
