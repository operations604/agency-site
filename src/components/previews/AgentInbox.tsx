import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { CalendarClock } from "lucide-react";

const CONVERSATIONS = [
  {
    inbound: "Hi, do you have any openings this Thursday afternoon?",
    reply:
      "We have 2:15pm or 3:30pm open this Thursday. Which works better for you?",
    action: "appointment booked for Thu 2:15pm",
  },
  {
    inbound: "Can someone come out to quote the roof on Friday?",
    reply:
      "Friday at 11:00am works. I will send the crew lead's name and ETA the day before.",
    action: "quote booked for Fri 11:00am",
  },
];

// Left-hand thread list. The first two rows are the live conversations above;
// the rest are history so the inbox reads as a real, busy one.
const THREADS = [
  { name: "Lena Ortiz", initials: "LO", hue: "222 84% 53%", snippet: "Hi, do you have any openings this…", time: "now" },
  { name: "Ben Calloway", initials: "BC", hue: "21 89% 54%", snippet: "Can someone come out to quote the…", time: "4m" },
  { name: "Priya Nair", initials: "PN", hue: "174 62% 40%", snippet: "Perfect, see you Tuesday.", time: "31m", done: "Booked" },
  { name: "Marcus Hill", initials: "MH", hue: "263 72% 64%", snippet: "Thanks for the quick reply!", time: "1h", done: "Booked" },
  { name: "Sofia Reyes", initials: "SR", hue: "38 92% 50%", snippet: "Is the estimate still valid for…", time: "2h", done: "Replied" },
];

type Phase = "inbound" | "typing" | "reply" | "action";

function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let i = 0;
    setCount(0);
    const interval = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) clearInterval(interval);
    }, 24);
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

export default function AgentInbox() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const reduced = useReducedMotion();
  const [convo, setConvo] = useState(0);
  const [phase, setPhase] = useState<Phase>("inbound");

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setPhase("action");
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === "inbound") {
      timer = setTimeout(() => setPhase("typing"), 900);
    } else if (phase === "typing") {
      timer = setTimeout(() => setPhase("reply"), 1100);
    } else if (phase === "reply") {
      timer = setTimeout(() => setPhase("action"), 2600);
    } else if (phase === "action") {
      timer = setTimeout(() => {
        setConvo((c) => (c + 1) % CONVERSATIONS.length);
        setPhase("inbound");
      }, 2800);
    }
    return () => clearTimeout(timer);
  }, [phase, convo, inView, reduced]);

  const current = CONVERSATIONS[convo];

  return (
    <div ref={ref} className="grid grid-cols-[176px_1fr]" style={{ minHeight: 360 }}>
      {/* Thread list */}
      <div className="flex flex-col border-r border-[hsl(38_21%_90%)] bg-[hsl(40_38%_97%)]">
        <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
          <span className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Inbox</span>
          <span className="rounded-full bg-[hsl(21_89%_54%/0.12)] px-1.5 py-0.5 font-mono-label text-[9px] text-[hsl(21_89%_42%)]">
            2
          </span>
        </div>
        <div className="flex-1">
          {THREADS.map((t, i) => {
            const active = i === convo;
            return (
              <div
                key={t.name}
                className={`flex items-start gap-2 border-l-2 px-3 py-2 ${
                  active
                    ? "border-[hsl(21_89%_54%)] bg-white"
                    : "border-transparent"
                }`}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                  style={{ background: `hsl(${t.hue})` }}
                >
                  {t.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-semibold text-[hsl(223_14%_10%)]">{t.name}</span>
                    <span className="shrink-0 font-mono-label text-[8px] text-[hsl(222_10%_60%)]">{t.time}</span>
                  </span>
                  <span className="block truncate text-[10px] leading-4 text-[hsl(222_10%_50%)]">{t.snippet}</span>
                  {t.done && (
                    <span className="mt-0.5 inline-block font-mono-label text-[8px] text-[hsl(147_66%_32%)]">
                      {t.done.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[hsl(180_80%_27%)]" />
          <div>
            <div className="text-[13px] font-semibold text-[hsl(223_14%_10%)]">
              Front desk agent
            </div>
            <div className="font-mono-label text-[9px] text-[hsl(147_66%_34%)]">
              online · SMS · (415) 555-0142
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-semibold tracking-tight text-[hsl(223_14%_10%)]">14</div>
          <div className="font-mono-label text-[8px] text-[hsl(222_10%_55%)]">BOOKED TODAY</div>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`in-${convo}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[hsl(38_21%_92%)] px-3.5 py-2.5 text-[14px] text-[hsl(223_14%_12%)]">
              {current.inbound}
            </div>
          </motion.div>
        </AnimatePresence>
        {phase !== "inbound" && (
          <div className="flex justify-end">
            {phase === "typing" ? (
              <div className="rounded-2xl rounded-tr-sm bg-[hsl(21_89%_54%/0.12)] px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[hsl(21_89%_54%)]"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.12,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[hsl(21_89%_54%/0.14)] px-3.5 py-2.5 text-[14px] text-[hsl(223_14%_10%)]"
              >
                {phase === "reply" ? (
                  <Typewriter text={current.reply} />
                ) : (
                  current.reply
                )}
              </motion.div>
            )}
          </div>
        )}
        <AnimatePresence>
          {phase === "action" && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 self-start rounded-lg border border-[hsl(180_80%_27%/0.3)] bg-[hsl(180_80%_27%/0.06)] px-3 py-2"
            >
              <CalendarClock size={14} className="text-[hsl(180_80%_27%)]" />
              <span className="font-mono-label text-[10px] text-[hsl(180_80%_22%)]">
                Action: {current.action}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Composer */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[hsl(38_21%_90%)] px-3 py-2">
        <span className="flex-1 text-[11px] text-[hsl(222_10%_60%)]">Agent is handling this thread…</span>
        <span className="rounded-md bg-[hsl(223_14%_10%)] px-2 py-0.5 text-[10px] font-medium text-white">Take over</span>
      </div>
      </div>
    </div>
  );
}
