import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  CalendarClock,
  ChartColumn,
  ChevronDown,
  ClipboardList,
  FileText,
  Inbox,
  Layers,
  LayoutDashboard,
  MapPin,
  Package,
  Phone,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { EASE } from "../../lib/animations";

const BLUE = "hsl(222 84% 53%)";
const BLUE_SOFT = "hsl(222 55% 72%)";

const JOBS_WEEK = [14, 18, 16, 22, 19, 27, 12];
const JOBS_LAST = [11, 15, 13, 17, 16, 21, 9];
const HOURS_WEEK = [28, 31, 29, 36, 34, 41, 22];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, label: "Overview", badge: null as number | null },
      { icon: Inbox, label: "Inbox", badge: 7 },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Layers, label: "Pipeline", badge: 18 },
      { icon: CalendarClock, label: "Dispatch", badge: 9 },
      { icon: MapPin, label: "Map", badge: null },
      { icon: Users, label: "Crew", badge: null },
      { icon: Package, label: "Parts", badge: 3 },
      { icon: Building2, label: "Customers", badge: null },
    ],
  },
  {
    label: "Money",
    items: [
      { icon: FileText, label: "Invoices", badge: null },
      { icon: ClipboardList, label: "Estimates", badge: 4 },
      { icon: ChartColumn, label: "Reports", badge: null },
    ],
  },
];

const KPIS = [
  {
    label: "Hours saved",
    value: 312,
    suffix: "",
    delta: "+18% vs Aug",
    note: "This month",
    spark: [18, 22, 20, 28, 26, 34, 31],
  },
  {
    label: "Leads under 5 min",
    value: 94,
    suffix: "%",
    delta: "SLA 90%",
    note: "First response",
    spark: [88, 90, 91, 93, 92, 95, 94],
  },
  {
    label: "Jobs on the board",
    value: 128,
    suffix: "",
    delta: "9 today",
    note: "Scheduled",
    spark: [14, 18, 16, 22, 19, 27, 12],
  },
  {
    label: "Invoices collected",
    value: 186420,
    suffix: "",
    delta: "476 filed",
    note: "This month",
    spark: [22, 28, 24, 36, 31, 44, 38],
    money: true,
  },
];

const PIPELINE = [
  { label: "New", value: 18, color: "hsl(222 84% 53%)" },
  { label: "Quoted", value: 9, color: "hsl(222 72% 62%)" },
  { label: "Booked", value: 7, color: "hsl(222 58% 46%)" },
  { label: "Invoiced", value: 5, color: "hsl(222 42% 34%)" },
];

const CREW_LOAD = [
  { name: "Luis M.", load: 86 },
  { name: "Jenna K.", load: 72 },
  { name: "Omar R.", load: 54 },
  { name: "Priya S.", load: 31 },
];

const STATUS = {
  progress: {
    label: "In progress",
    cls: "bg-primary/10 text-[hsl(222_70%_38%)]",
  },
  route: {
    label: "En route",
    cls: "bg-[hsl(222_84%_53%/0.16)] text-[hsl(222_62%_36%)]",
  },
  set: {
    label: "Scheduled",
    cls: "bg-[hsl(220_24%_94%)] text-[hsl(222_14%_40%)]",
  },
  parts: {
    label: "Parts ready",
    cls: "bg-[hsl(222_40%_94%)] text-[hsl(222_55%_36%)]",
  },
  new: {
    label: "New",
    cls: "bg-primary/10 text-[hsl(222_70%_38%)]",
  },
};

type JobStatus = keyof typeof STATUS;
type BoardJob = {
  time: string;
  job: string;
  addr: string;
  tech: string;
  zone: string;
  status: JobStatus;
};
type Page = "Overview" | "Inbox" | "Pipeline" | "Dispatch" | "Crew" | "Customers" | "Invoices";
type InboxPhase = "in" | "typing" | "reply" | "done";

const BOARD: BoardJob[] = [
  {
    time: "7:30a",
    job: "HVAC diagnostic",
    addr: "1842 Barton Springs Rd",
    tech: "Luis M.",
    zone: "Central",
    status: "progress",
  },
  {
    time: "9:15a",
    job: "Water heater swap",
    addr: "410 Nueces St",
    tech: "Jenna K.",
    zone: "Central",
    status: "route",
  },
  {
    time: "10:00a",
    job: "AC tune-up",
    addr: "2200 Guadalupe St",
    tech: "Luis M.",
    zone: "Campus",
    status: "set",
  },
  {
    time: "11:30a",
    job: "Sewer camera",
    addr: "908 W 12th St",
    tech: "Omar R.",
    zone: "West",
    status: "parts",
  },
];

const INCOMING: BoardJob = {
  time: "2:45p",
  job: "Emergency leak",
  addr: "512 Congress Ave",
  tech: "Omar R.",
  zone: "Downtown",
  status: "new",
};

function curve(values: number[], w: number, h: number, max: number) {
  const padL = 6;
  const padR = 8;
  const padT = 16;
  const padB = 10;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const pts = values.map((v, i) => {
    const x = padL + (i / (values.length - 1)) * innerW;
    const y = padT + innerH - (v / max) * innerH;
    return [x, y] as const;
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return { d, pts };
}

function CountUp({
  target,
  reduced,
  delay,
  money,
}: {
  target: number;
  reduced: boolean;
  delay: number;
  money?: boolean;
}) {
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startAt = performance.now() + delay * 1000;
    const duration = 1500;
    const tick = (now: number) => {
      if (now < startAt) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, delay]);

  if (money) return <span>${value.toLocaleString()}</span>;
  return <span>{value.toLocaleString()}</span>;
}

function BrandMark({ size }: { size: number }) {
  return <img src="/favicon.svg?v=4" alt="" className="shrink-0" style={{ width: size, height: size }} />;
}

function pop(delay: number, reduced: boolean) {
  if (reduced) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0, scale: 1 },
    };
  }
  return {
    initial: { opacity: 0, y: 14, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.45, delay, ease: EASE },
  };
}

export default function CompanyDashboard({ reduced }: { reduced: boolean }) {
  const gid = useId().replace(/:/g, "");
  const [jobs, setJobs] = useState<BoardJob[]>(BOARD);
  const [weekData, setWeekData] = useState(JOBS_WEEK);
  const [hoursData, setHoursData] = useState(HOURS_WEEK);
  const [crewOut, setCrewOut] = useState(8);
  const [crewLoad, setCrewLoad] = useState(CREW_LOAD);
  const [hoursSaved, setHoursSaved] = useState(312);
  const [pipe, setPipe] = useState(PIPELINE.map((p) => p.value));
  const [page, setPage] = useState<Page>("Overview");
  const [inboxPhase, setInboxPhase] = useState<InboxPhase>("in");
  const [pipeStep, setPipeStep] = useState(0);
  const [inboxBadge, setInboxBadge] = useState(7);
  const [invoicePaid, setInvoicePaid] = useState(reduced);
  const week = useMemo(() => curve(weekData, 360, 118, 32), [weekData]);
  const last = useMemo(() => curve(JOBS_LAST, 360, 118, 32), []);
  const hours = useMemo(() => curve(hoursData, 360, 118, 48), [hoursData]);
  const area = `${week.d} L${week.pts[week.pts.length - 1][0].toFixed(1)},118 L${week.pts[0][0].toFixed(1)},118 Z`;
  const peak = week.pts[5];
  const pipeTotal = pipe.reduce((s, v) => s + v, 0);
  const ring = 2 * Math.PI * 16;
  const ringFill = (crewOut / 9) * ring;

  useEffect(() => {
    if (reduced) {
      setJobs([INCOMING, ...BOARD].slice(0, 4));
      return;
    }
    const addJob = window.setTimeout(() => {
      setJobs((prev) => [INCOMING, ...prev].slice(0, 4));
    }, 6400);
    return () => window.clearTimeout(addJob);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const beat = window.setInterval(() => {
      setWeekData((prev) =>
        prev.map((v, i) => {
          if (i !== prev.length - 1) return v;
          const next = v + (v < 16 ? 2 : -2);
          return Math.max(10, Math.min(22, next));
        }),
      );
      setHoursData((prev) =>
        prev.map((v, i) => (i === prev.length - 1 ? Math.max(18, Math.min(30, v + (v < 24 ? 2 : -2))) : v)),
      );
      setCrewOut((n) => (n === 8 ? 9 : 8));
      setCrewLoad((prev) =>
        prev.map((c, i) => ({
          ...c,
          load: Math.max(24, Math.min(92, c.load + (i % 2 === 0 ? 4 : -3))),
        })),
      );
      setHoursSaved((n) => n + 1);
      setPipe((prev) => {
        const next = [...prev];
        if (next[0] > 14) {
          next[0] -= 1;
          next[2] += 1;
        } else {
          next[0] += 1;
          next[2] -= 1;
        }
        return next;
      });
      setJobs((prev) =>
        prev.map((row, i) => {
          if (i !== 2) return row;
          const order: JobStatus[] = ["set", "route", "progress"];
          const at = order.indexOf(row.status);
          return { ...row, status: order[(at + 1) % order.length] };
        }),
      );
    }, 5600);
    return () => window.clearInterval(beat);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const timers: number[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });
    let stop = false;
    (async () => {
      await sleep(6200);
      while (!stop) {
        setPage("Inbox");
        setInboxPhase("in");
        setInboxBadge(7);
        await sleep(900);
        if (stop) return;
        setInboxPhase("typing");
        await sleep(1100);
        if (stop) return;
        setInboxPhase("reply");
        await sleep(2600);
        if (stop) return;
        setInboxPhase("done");
        setInboxBadge(6);
        await sleep(1800);
        if (stop) return;
        setPage("Pipeline");
        setPipeStep(0);
        await sleep(1000);
        if (stop) return;
        setPipeStep(1);
        await sleep(1500);
        if (stop) return;
        setPipeStep(2);
        await sleep(2200);
        if (stop) return;
        setPage("Dispatch");
        await sleep(4000);
        if (stop) return;
        setPage("Crew");
        await sleep(3200);
        if (stop) return;
        setPage("Customers");
        await sleep(3200);
        if (stop) return;
        setPage("Invoices");
        setInvoicePaid(false);
        await sleep(1400);
        if (stop) return;
        setInvoicePaid(true);
        await sleep(2600);
        if (stop) return;
        setPage("Overview");
        await sleep(6500);
      }
    })();
    return () => {
      stop = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  const search =
    page === "Inbox"
      ? "Search conversations"
      : page === "Pipeline"
        ? "Search leads"
        : page === "Dispatch"
          ? "Search jobs and techs"
          : page === "Crew"
            ? "Search crew"
            : page === "Customers"
              ? "Search customers"
              : page === "Invoices"
                ? "Search invoices"
                : "Search jobs, customers, invoices";

  return (
    <div
      className="pointer-events-none flex h-full min-h-0 w-full overflow-hidden bg-[hsl(220_40%_97%)] text-[hsl(224_30%_12%)]"
      aria-hidden
    >
      <aside className="flex w-[31%] max-w-[188px] min-w-[148px] shrink-0 flex-col border-r border-border bg-white">
        <motion.div {...pop(0.04, reduced)} className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
          <BrandMark size={18} />
          <div className="min-w-0 leading-tight">
            <div className="text-[11px] font-semibold tracking-tight">Applied Systems</div>
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              Meridian · Austin
              <ChevronDown size={10} />
            </div>
          </div>
        </motion.div>
        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-1.5 pb-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-0.5">
              <div className="px-2 pt-0.5 pb-px font-mono text-[8px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
                {group.label}
              </div>
              {group.items.map((item, i) => {
                const Icon = item.icon;
                const current = item.label === page;
                const badge =
                  item.label === "Inbox"
                    ? inboxBadge
                    : item.label === "Dispatch"
                      ? jobs.length
                      : item.badge;
                return (
                  <motion.div
                    key={item.label}
                    initial={reduced ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease: EASE }}
                    className={`relative flex items-center gap-2 rounded-md px-2 py-[3px] text-[11px] ${
                      current
                        ? "font-medium text-[hsl(222_70%_38%)]"
                        : "text-[hsl(222_14%_40%)]"
                    }`}
                  >
                    {current && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-md bg-primary/10"
                        transition={{ duration: 0.35, ease: EASE }}
                      />
                    )}
                    <Icon size={13} strokeWidth={1.85} className="relative" />
                    <span className="relative flex-1 truncate">{item.label}</span>
                    {badge != null && (
                      <span
                        className={`relative rounded-full px-1.5 py-px font-mono text-[8px] ${
                          current
                            ? "bg-primary/15 text-[hsl(222_70%_36%)]"
                            : "bg-[hsl(220_24%_94%)] text-muted-foreground"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </nav>
        <motion.div
          {...pop(0.55, reduced)}
          className="flex items-center gap-2 border-t border-border px-2.5 py-1.5"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[8px] font-semibold text-white">
            DC
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[10px] font-medium">Dana Chen</div>
            <div className="text-[8px] text-muted-foreground">Ops manager</div>
          </div>
          <Settings size={11} className="text-muted-foreground" />
        </motion.div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <motion.header
          {...pop(0.08, reduced)}
          className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-white px-2.5"
        >
          <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-[hsl(220_40%_97%)] px-2 text-[11px] text-muted-foreground">
            <Search size={12} strokeWidth={1.8} />
            <span className="min-w-0 truncate">{search}</span>
            <span className="ml-auto hidden rounded border border-border bg-white px-1 py-px font-mono text-[8px] sm:inline">
              ⌘K
            </span>
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">Thu, Sep 3</span>
          <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border">
            <Bell size={13} strokeWidth={1.8} />
            <span className="absolute -top-1 -right-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 font-mono text-[8px] text-white">
              3
            </span>
          </span>
        </motion.header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 flex flex-col gap-2 p-2 ${
            page === "Overview" ? "" : "invisible"
          }`}
        >
          <motion.div {...pop(0.22, reduced)} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold tracking-tight">
                Good morning, Dana
              </h2>
              <p className="truncate text-[10px] text-muted-foreground">
                {jobs.length} jobs on the board. Two emergency slots still open.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-1 rounded-full border border-border bg-white px-2 py-1 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-medium">{crewOut} of 9 techs out</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1">
                <span className="dash-live-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[9px] font-semibold tracking-wide text-[hsl(222_70%_38%)]">
                  LIVE
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-4 gap-1.5">
            {KPIS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                {...pop(0.38 + i * 0.08, reduced)}
                className="overflow-hidden rounded-lg border border-border bg-white px-2 py-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-mono text-[8px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    {kpi.label}
                  </div>
                  <div className="flex h-5 items-end gap-px">
                    {kpi.spark.map((v, s) => (
                      <motion.span
                        key={s}
                        className="w-[3px] rounded-[1px] bg-primary"
                        initial={{ height: reduced ? (v / Math.max(...kpi.spark)) * 18 : 0 }}
                        animate={{ height: (v / Math.max(...kpi.spark)) * 18 }}
                        transition={{
                          duration: 0.55,
                          delay: reduced ? 0 : 0.7 + i * 0.08 + s * 0.04,
                          ease: EASE,
                        }}
                        style={{ opacity: 0.45 + (s / kpi.spark.length) * 0.55 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-0.5 text-[18px] font-semibold tracking-tight tabular-nums leading-none">
                  <CountUp
                    target={kpi.money ? kpi.value : i === 0 ? hoursSaved : kpi.value}
                    reduced={reduced}
                    delay={0.55 + i * 0.08}
                    money={kpi.money}
                  />
                  {kpi.suffix}
                </div>
                <div className="mt-1 flex items-center justify-between gap-1 text-[9px]">
                  <span className="truncate font-medium text-[hsl(222_70%_38%)]">{kpi.delta}</span>
                  <span className="truncate text-muted-foreground">{kpi.note}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-1.5">
            <motion.div
              {...pop(0.85, reduced)}
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-white p-2"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold tracking-tight">Jobs completed</div>
                  <div className="text-[9px] text-muted-foreground">This week vs last week</div>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-px w-3 bg-primary" /> Jobs
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-px w-3 bg-[hsl(222_55%_72%)]" /> Hours
                  </span>
                </div>
              </div>
              <div className="relative min-h-0 flex-1">
                <svg viewBox="0 0 360 118" className="h-full w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(222 84% 53% / 0.22)" />
                      <stop offset="100%" stopColor="hsl(222 84% 53% / 0)" />
                    </linearGradient>
                  </defs>
                  {[28, 52, 76, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="360"
                      y2={y}
                      stroke="hsl(220 20% 90%)"
                      strokeWidth="1"
                    />
                  ))}
                  <motion.path
                    d={last.d}
                    fill="none"
                    stroke={BLUE_SOFT}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 0.7 : 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: reduced ? 0 : 1.15, delay: reduced ? 0 : 1.2, ease: "easeInOut" }}
                  />
                  <motion.path
                    d={area}
                    fill={`url(#${gid}-fill)`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 2.15 }}
                  />
                  <motion.path
                    d={week.d}
                    fill="none"
                    stroke={BLUE}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: reduced ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 1.55, delay: reduced ? 0 : 1.55, ease: "easeInOut" }}
                  />
                  <motion.path
                    d={hours.d}
                    fill="none"
                    stroke={BLUE_SOFT}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 0.9 : 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ duration: reduced ? 0 : 1.3, delay: reduced ? 0 : 2.4, ease: "easeInOut" }}
                  />
                  <motion.circle
                    cx={peak[0]}
                    cy={peak[1]}
                    r="4"
                    fill="white"
                    stroke={BLUE}
                    strokeWidth="2"
                    initial={{ scale: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 3.05, duration: 0.35, ease: EASE }}
                  />
                </svg>
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 3.1, duration: 0.4, ease: EASE }}
                  className="absolute top-0 right-0 rounded-md border border-border bg-white px-1.5 py-0.5"
                >
                  <div className="font-mono text-[7px] tracking-[0.06em] text-primary uppercase">
                    Peak
                  </div>
                  <div className="text-[10px] font-semibold">27 jobs · Sat</div>
                </motion.div>
              </div>
              <div className="mt-1 flex h-[42px] items-end gap-1.5">
                {weekData.map((v, i) => (
                  <div key={DAYS[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <motion.div
                      className="w-full rounded-t-[4px] bg-primary/85"
                      initial={{ height: reduced ? `${(v / 32) * 34}px` : 0 }}
                      animate={{ height: `${(v / 32) * 34}px` }}
                      transition={{
                        duration: 0.6,
                        delay: reduced ? 0 : 2.35 + i * 0.08,
                        ease: EASE,
                      }}
                    />
                    <span className="font-mono text-[8px] text-muted-foreground">{DAYS[i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[8px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    Lead pipeline
                  </span>
                  <span className="text-[9px] text-muted-foreground">{pipeTotal} open</span>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-[hsl(220_24%_93%)]">
                  {PIPELINE.map((p, i) => (
                    <motion.span
                      key={p.label}
                      className="h-full"
                      style={{ background: p.color }}
                      initial={{ width: reduced ? `${(pipe[i] / pipeTotal) * 100}%` : 0 }}
                      animate={{ width: `${(pipe[i] / Math.max(pipeTotal, 1)) * 100}%` }}
                      transition={{
                        duration: 0.7,
                        delay: reduced ? 0 : 2.7 + i * 0.12,
                        ease: EASE,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5">
                  {PIPELINE.map((p, i) => (
                    <div key={p.label} className="flex items-center gap-1 text-[9px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="font-medium">{pipe[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="flex min-h-0 flex-col gap-1.5">
              <motion.div
                {...pop(1.05, reduced)}
                className="flex min-h-0 flex-[1.15] flex-col overflow-hidden rounded-lg border border-border bg-white"
              >
                <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
                  <div>
                    <div className="text-[12px] font-semibold tracking-tight">Today's board</div>
                    <div className="text-[9px] text-muted-foreground">Thu, Sep 3 · Austin</div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-[hsl(222_70%_38%)]">
                    {jobs.length} jobs
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden px-1 py-0.5">
                  <AnimatePresence initial={false}>
                    {jobs.map((row, i) => (
                      <motion.div
                        key={row.job}
                        layout
                        initial={reduced ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          duration: 0.45,
                          delay: reduced || row.job === INCOMING.job ? 0 : 1.15 + i * 0.12,
                          ease: EASE,
                        }}
                        className="overflow-hidden"
                      >
                        <BoardRow row={row} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                {...pop(1.25, reduced)}
                className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white p-2"
              >
                <div className="flex w-[42%] shrink-0 flex-col items-center justify-center">
                  <svg viewBox="0 0 44 44" className="h-[72px] w-[72px]">
                    <circle
                      cx="22"
                      cy="22"
                      r="16"
                      fill="none"
                      stroke="hsl(220 24% 92%)"
                      strokeWidth="5"
                    />
                    <motion.circle
                      cx="22"
                      cy="22"
                      r="16"
                      fill="none"
                      stroke={BLUE}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={ring}
                      transform="rotate(-90 22 22)"
                      initial={{ strokeDashoffset: reduced ? ring - ringFill : ring }}
                      animate={{ strokeDashoffset: ring - ringFill }}
                      transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 1.6, ease: EASE }}
                    />
                  </svg>
                  <div className="mt-0.5 text-[13px] font-semibold tabular-nums leading-none">
                    {crewOut}/9
                  </div>
                  <div className="text-[8px] text-muted-foreground">Crew in field</div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pl-1">
                  {crewLoad.map((c, i) => (
                    <div key={c.name}>
                      <div className="mb-0.5 flex items-center justify-between text-[8px]">
                        <span className="truncate font-medium">{c.name}</span>
                        <span className="text-muted-foreground">{c.load}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[hsl(220_24%_93%)]">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: reduced ? `${c.load}%` : 0 }}
                          animate={{ width: `${c.load}%` }}
                          transition={{
                            duration: 0.7,
                            delay: reduced ? 0 : 1.7 + i * 0.1,
                            ease: EASE,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
          <AnimatePresence>
            {page !== "Overview" && (
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="absolute inset-0 p-2"
              >
                {page === "Inbox" && <InboxView phase={inboxPhase} />}
                {page === "Pipeline" && <PipelineView step={pipeStep} />}
                {page === "Dispatch" && <DispatchView jobs={jobs} />}
                {page === "Crew" && <CrewView load={crewLoad} out={crewOut} />}
                {page === "Customers" && <CustomersView />}
                {page === "Invoices" && <InvoicesView paid={invoicePaid} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[8px] font-semibold text-[hsl(222_70%_38%)]">
      {letters}
    </span>
  );
}

function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, count)}
      {count < text.length && (
        <span className="ml-px inline-block h-[11px] w-px bg-white align-middle" />
      )}
    </span>
  );
}

const THREADS = [
  { name: "Sarah Kim", channel: "SMS", preview: "Thursday afternoon?", time: "2m", unread: true },
  { name: "North Austin HOA", channel: "Email", preview: "Invoice #4418 received", time: "11m", unread: true },
  { name: "Google LSA", channel: "LSA", preview: "AC not cooling in 78704", time: "24m", unread: false },
  { name: "Claire Nguyen", channel: "SMS", preview: "Can we move Friday?", time: "1h", unread: false },
];

function InboxView({ phase }: { phase: InboxPhase }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight">Inbox</h2>
        <p className="text-[10px] text-muted-foreground">
          {phase === "typing"
            ? "Front desk agent is drafting"
            : phase === "done"
              ? "Booked Thu 2:45p · Omar R."
              : "Assigned to Dana · 2 unread"}
        </p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[0.36fr_0.64fr] overflow-hidden rounded-lg border border-border bg-white">
        <div className="min-h-0 overflow-hidden border-r border-border">
          {THREADS.map((t, i) => (
            <div
              key={t.name}
              className={`flex gap-2 border-b border-border px-2 py-2 ${i === 0 ? "bg-primary/10" : ""}`}
            >
              <Initials name={t.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-medium">{t.name}</span>
                  <span className="font-mono text-[8px] text-muted-foreground">{t.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="rounded bg-[hsl(220_24%_94%)] px-1 font-mono text-[7px] text-muted-foreground">
                    {t.channel}
                  </span>
                  <span className="truncate text-[9px] text-muted-foreground">{t.preview}</span>
                </div>
              </div>
              {t.unread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            </div>
          ))}
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5">
            <div>
              <div className="text-[12px] font-semibold">Sarah Kim</div>
              <div className="text-[9px] text-muted-foreground">Google LSA · scored 92 · 78704</div>
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
              <Phone size={10} /> 512-555-0194
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2.5">
            <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-[hsl(220_36%_96%)] px-2.5 py-1.5 text-[11px] leading-snug">
              Hi, do you have any openings this Thursday afternoon?
            </div>
            <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-[hsl(220_36%_96%)] px-2.5 py-1.5 text-[11px] leading-snug">
              AC has not been cooling since last night. 78704.
            </div>
            <AnimatePresence>
              {phase === "typing" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-1 self-end rounded-lg bg-primary/10 px-2.5 py-2"
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-primary/55"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {(phase === "reply" || phase === "done") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[90%] self-end rounded-lg rounded-tr-sm bg-primary px-2.5 py-1.5 text-[11px] leading-snug text-white"
              >
                {phase === "reply" ? (
                  <Typewriter text="We have 9:15a or 2:45p Thursday. 2:45p keeps Omar on your street." />
                ) : (
                  "We have 9:15a or 2:45p Thursday. 2:45p keeps Omar on your street."
                )}
              </motion.div>
            )}
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-end rounded-md border border-border px-2 py-1 text-[9px] font-medium"
              >
                Booked Thu 2:45p · Omar R. · 512 Congress
              </motion.div>
            )}
          </div>
          <div className="border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">
            {phase === "typing" ? "Applied is writing" : "Reply as Applied · Front desk"}
          </div>
        </div>
      </div>
    </div>
  );
}

const PIPE_STATIC = [
  [
    { name: "Mark Ellison", detail: "Water heater · 78" },
    { name: "Riverside Flats", detail: "Maintenance plan · 64" },
  ],
  [
    { name: "Claire Nguyen", detail: "Mini-split · $4,200" },
    { name: "East Side Clinic", detail: "RTU replace · $11,800" },
  ],
  [
    { name: "J. Patel", detail: "Sewer camera · Fri 11:30a" },
    { name: "Barton Office", detail: "HVAC diagnostic · today" },
  ],
  [{ name: "North Austin HOA", detail: "#4418 · $2,840" }],
];

function PipelineView({ step }: { step: number }) {
  const labels = ["New", "Quoted", "Booked", "Invoiced"];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight">Pipeline</h2>
        <p className="text-[10px] text-muted-foreground">
          {step === 0
            ? "Scoring Sarah Kim from Google LSA"
            : step === 1
              ? "Quote drafted · waiting to send"
              : "Booked onto Thursday dispatch"}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 gap-1.5">
        {labels.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col rounded-lg bg-[hsl(220_32%_96%)] p-1.5">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[9px] font-semibold">{label}</span>
              <span className="font-mono text-[8px] text-muted-foreground">
                {PIPE_STATIC[i].length + (step === i ? 1 : 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {step === i && (
                <motion.div
                  layoutId="sarah-lead"
                  transition={{ duration: 0.7, ease: EASE }}
                  className="rounded-md border border-primary/25 bg-white p-1.5"
                >
                  <div className="truncate text-[10px] font-medium">Sarah Kim</div>
                  <div className="truncate text-[8px] text-muted-foreground">AC not cooling · 92</div>
                </motion.div>
              )}
              {PIPE_STATIC[i].map((card) => (
                <div key={card.name} className="rounded-md border border-border bg-white p-1.5">
                  <div className="truncate text-[10px] font-medium">{card.name}</div>
                  <div className="truncate text-[8px] text-muted-foreground">{card.detail}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DispatchView({ jobs }: { jobs: BoardJob[] }) {
  const [focus, setFocus] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setFocus((f) => (f + 1) % Math.max(jobs.length, 1)), 1600);
    return () => window.clearInterval(t);
  }, [jobs.length]);
  const current = jobs[focus] ?? jobs[0];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight">Dispatch</h2>
        <p className="text-[10px] text-muted-foreground">
          {current ? `${current.tech} · ${current.job} · ${current.zone}` : "Today's routes"}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        <div className="grid grid-cols-[40px_minmax(0,1.1fr)_72px_56px_auto] border-b border-border px-2 py-1 font-mono text-[8px] tracking-[0.06em] text-muted-foreground uppercase">
          <span>Time</span>
          <span>Job</span>
          <span>Tech</span>
          <span>Zone</span>
          <span className="text-right">Status</span>
        </div>
        {jobs.map((row, i) => (
          <div
            key={row.job}
            className={`grid grid-cols-[40px_minmax(0,1.1fr)_72px_56px_auto] items-center border-b border-border px-2 py-1.5 ${
              i === focus ? "border-l-2 border-l-primary bg-[hsl(220_36%_98%)]" : "border-l-2 border-l-transparent"
            }`}
          >
            <span className="font-mono text-[9px] text-muted-foreground">{row.time}</span>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium">{row.job}</div>
              <div className="truncate text-[8px] text-muted-foreground">{row.addr}</div>
            </div>
            <span className="flex items-center gap-1 truncate text-[10px]">
              <Initials name={row.tech} />
              {row.tech.split(" ")[0]}
            </span>
            <span className="text-[9px] text-muted-foreground">{row.zone}</span>
            <span className={`justify-self-end rounded-full px-1.5 py-px text-[7px] font-semibold ${STATUS[row.status].cls}`}>
              {STATUS[row.status].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const INVOICE_ROWS = [
  { id: "#4418", who: "North Austin HOA", job: "RTU replace", amount: "$2,840", status: "Filing" },
  { id: "#4415", who: "Claire Nguyen", job: "Mini-split", amount: "$4,200", status: "Sent" },
  { id: "#4412", who: "East Side Clinic", job: "Maintenance", amount: "$380", status: "Paid" },
  { id: "#4409", who: "Riverside Flats", job: "Water heater", amount: "$1,190", status: "Paid" },
];

function InvoicesView({ paid }: { paid: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Invoices</h2>
          <p className="text-[10px] text-muted-foreground">
            {paid ? "#4418 filed to QuickBooks" : "Matching #4418 to North Austin HOA"}
          </p>
        </div>
        <div className="flex gap-3 text-[10px]">
          <div>
            <div className="text-muted-foreground">Open</div>
            <div className="font-semibold">$8,420</div>
          </div>
          <div>
            <div className="text-muted-foreground">Paid this week</div>
            <div className="font-semibold">$5,570</div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        <div className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,0.8fr)_64px_auto] border-b border-border px-2 py-1 font-mono text-[8px] tracking-[0.06em] text-muted-foreground uppercase">
          <span>No.</span>
          <span>Customer</span>
          <span>Job</span>
          <span>Amount</span>
          <span className="text-right">Status</span>
        </div>
        {INVOICE_ROWS.map((row, i) => {
          const status = i === 0 && paid ? "Paid" : row.status;
          return (
            <div
              key={row.id}
              className={`grid grid-cols-[64px_minmax(0,1fr)_minmax(0,0.8fr)_64px_auto] items-center border-b border-border px-2 py-1.5 ${
                i === 0 ? "border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
              }`}
            >
              <span className="font-mono text-[10px]">{row.id}</span>
              <span className="truncate text-[11px] font-medium">{row.who}</span>
              <span className="truncate text-[10px] text-muted-foreground">{row.job}</span>
              <span className="text-[11px] font-semibold tabular-nums">{row.amount}</span>
              <span
                className={`justify-self-end rounded-full px-1.5 py-px text-[8px] font-semibold ${
                  status === "Paid"
                    ? "bg-primary/10 text-[hsl(222_70%_38%)]"
                    : "bg-[hsl(220_24%_94%)] text-muted-foreground"
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CREW_ROWS = [
  { name: "Luis M.", role: "Lead tech", status: "On job", zone: "Central" },
  { name: "Jenna K.", role: "Installer", status: "En route", zone: "Central" },
  { name: "Omar R.", role: "Plumber", status: "Available", zone: "Downtown" },
  { name: "Priya S.", role: "Helper", status: "Shop", zone: "West" },
];

function CrewView({
  load,
  out,
}: {
  load: { name: string; load: number }[];
  out: number;
}) {
  const [focus, setFocus] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setFocus((f) => (f + 1) % CREW_ROWS.length), 1400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight">Crew</h2>
        <p className="text-[10px] text-muted-foreground">
          {out} of 9 in the field · {CREW_ROWS[focus].name} {CREW_ROWS[focus].status.toLowerCase()}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        {CREW_ROWS.map((row, i) => {
          const bar = load.find((c) => c.name === row.name)?.load ?? 40;
          return (
            <div
              key={row.name}
              className={`flex items-center gap-2 border-b border-border px-2 py-2 ${
                i === focus ? "border-l-2 border-l-primary bg-[hsl(220_36%_98%)]" : "border-l-2 border-l-transparent"
              }`}
            >
              <Initials name={row.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-medium">{row.name}</span>
                  <span className="text-[9px] text-muted-foreground">{row.zone}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-muted-foreground">{row.role}</span>
                  <span className="text-[9px] font-medium text-[hsl(222_70%_38%)]">{row.status}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[hsl(220_24%_93%)]">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${bar}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CUSTOMERS = [
  { name: "Sarah Kim", note: "Booked Thu 2:45p", tag: "LSA" },
  { name: "North Austin HOA", note: "Invoice #4418 open", tag: "Account" },
  { name: "Claire Nguyen", note: "Mini-split quote sent", tag: "Residential" },
  { name: "East Side Clinic", note: "Maintenance plan", tag: "Commercial" },
];

function CustomersView() {
  const [focus, setFocus] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setFocus((f) => (f + 1) % CUSTOMERS.length), 1400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight">Customers</h2>
        <p className="text-[10px] text-muted-foreground">
          Opening {CUSTOMERS[focus].name} · {CUSTOMERS[focus].note}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        {CUSTOMERS.map((row, i) => (
          <div
            key={row.name}
            className={`flex items-center gap-2 border-b border-border px-2 py-2 ${
              i === focus ? "border-l-2 border-l-primary bg-[hsl(220_36%_98%)]" : "border-l-2 border-l-transparent"
            }`}
          >
            <Initials name={row.name} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium">{row.name}</div>
              <div className="truncate text-[9px] text-muted-foreground">{row.note}</div>
            </div>
            <span className="rounded bg-[hsl(220_24%_94%)] px-1.5 py-px font-mono text-[8px] text-muted-foreground">
              {row.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardRow({ row }: { row: BoardJob }) {
  const st = STATUS[row.status];
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-1 px-1 py-[5px]">
      <span className="font-mono text-[9px] text-muted-foreground">{row.time}</span>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-medium">{row.job}</div>
        <div className="truncate text-[9px] text-muted-foreground">
          {row.addr} · {row.tech}
        </div>
      </div>
      <span
        className={`justify-self-end rounded-full px-1.5 py-px text-[7px] font-semibold tracking-wide whitespace-nowrap ${st.cls}`}
      >
        {st.label}
      </span>
    </div>
  );
}
