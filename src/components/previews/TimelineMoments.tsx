import type { ReactNode } from "react";
import { Check } from "lucide-react";

/*
  One picture plane for every step. No app chrome — that read as fake
  product windows. Same height, same padding, same type. The picture
  is the moment: a week, a person's day, a scope, a build, a note, live.
*/

function Plate({ children }: { children: ReactNode }) {
  return (
    <div className="hairline soft-shadow-lg flex h-[300px] flex-col justify-center overflow-hidden rounded-2xl bg-white px-6 py-5">
      {children}
    </div>
  );
}

const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-mono-label text-[9px] ${className}`}>{children}</span>
);

function CallMoment() {
  const days = [
    { d: "Mon", work: "Inbox" },
    { d: "Tue", work: null },
    { d: "Wed", work: "Invoices" },
    { d: "Thu", work: "Leads" },
    { d: "Fri", work: null },
    { d: "Sat", work: null },
    { d: "Sun", work: null },
  ];
  return (
    <Plate>
      <Mono className="text-muted-foreground">The week you walk us through</Mono>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.d}
            className={`flex min-w-0 flex-col rounded-xl px-1 py-2 ${
              day.work
                ? "bg-[hsl(222_84%_53%/0.08)] ring-1 ring-[hsl(222_84%_53%/0.22)]"
                : "bg-[hsl(220_24%_97%)]"
            }`}
          >
            <div className="text-center font-mono-label text-[8px] text-muted-foreground">{day.d}</div>
            <div className="mt-3 min-h-[44px] text-center text-[10px] font-semibold leading-tight text-[hsl(222_84%_38%)]">
              {day.work ?? ""}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {["You", "Applied"].map((who, i) => (
          <div
            key={who}
            className="flex flex-1 items-center gap-2 rounded-lg bg-[hsl(220_24%_97%)] px-2.5 py-2"
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[8px] font-semibold text-white ${
                i === 0 ? "bg-[hsl(222_30%_28%)]" : "bg-primary"
              }`}
            >
              {who[0]}
            </span>
            <span className="text-[12px] font-medium">{who}</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(147_66%_39%)]" />
          </div>
        ))}
      </div>
    </Plate>
  );
}

function DiveMoment() {
  const rows = [
    { t: "9:00", what: "Inbox → Drive", who: "every morning" },
    { t: "11:00", what: "Invoice → books", who: "about 40 minutes", here: true },
    { t: "2:00", what: "Chase approvals", who: "in Slack" },
  ];
  return (
    <Plate>
      <div className="flex items-baseline justify-between gap-3">
        <Mono className="text-muted-foreground">Sitting with the person who does it</Mono>
        <span className="text-[12px] font-semibold">Maya · AP</span>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.t}
            className={`grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-xl px-3 py-2.5 ${
              r.here ? "bg-[hsl(222_84%_53%/0.08)] ring-1 ring-[hsl(222_84%_53%/0.22)]" : "bg-[hsl(220_24%_97%)]"
            }`}
          >
            <Mono className="text-muted-foreground">{r.t}</Mono>
            <div>
              <div className="text-[13px] font-semibold">{r.what}</div>
              <div className="text-[11px] text-muted-foreground">{r.who}</div>
            </div>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

function PlanMoment() {
  return (
    <Plate>
      <div className="flex items-center justify-between">
        <Mono className="text-muted-foreground">Written down. Then we start.</Mono>
        <span className="rounded-full bg-[hsl(147_66%_39%/0.12)] px-2 py-0.5 font-mono-label text-[9px] text-[hsl(147_66%_28%)]">
          Fixed
        </span>
      </div>
      <div className="mt-4 text-[15px] font-semibold">Scope of work</div>
      <ul className="mt-3 space-y-0">
        {["Invoice intake → books", "Approvals in Slack", "Training and handoff"].map((t) => (
          <li key={t} className="flex items-center gap-2.5 border-t border-[hsl(220_20%_93%)] py-2.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[hsl(147_66%_39%)]">
              <Check size={9} strokeWidth={3} className="text-white" />
            </span>
            <span className="text-[13px] font-medium">{t}</span>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

function BuildMoment() {
  const chain = [
    { logo: "gmail", label: "Inbox" },
    { logo: "slack", label: "Approve" },
    { logo: "quickbooks", label: "Books" },
  ];
  return (
    <Plate>
      <Mono className="text-muted-foreground">On your tools. On your data.</Mono>
      <div className="mt-8 flex items-center justify-between gap-2">
        {chain.map((n, i) => (
          <div key={n.logo} className="flex flex-1 items-center">
            <div className="mx-auto flex flex-col items-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-[0_1px_3px_#151a2818] ring-1 ring-[hsl(220_20%_90%)]">
                <img src={`/logos/${n.logo}.webp`} alt="" className="h-6 w-6 object-contain" />
              </span>
              <Mono className="text-muted-foreground">{n.label}</Mono>
            </div>
            {i < chain.length - 1 && (
              <span className="tm-flow mb-5 h-px w-8 shrink-0 bg-primary/50" />
            )}
          </div>
        ))}
      </div>
    </Plate>
  );
}

function ReviewMoment() {
  return (
    <Plate>
      <Mono className="text-muted-foreground">You see it running. You shape it.</Mono>
      <div className="mt-5 rounded-xl bg-[hsl(220_24%_97%)] px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold">You</span>
          <Mono className="text-muted-foreground">just now</Mono>
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.5]">
          Put approvals in{" "}
          <span className="rounded bg-[hsl(222_84%_53%/0.1)] px-1 text-[hsl(222_84%_45%)]">#finance</span>{" "}
          and flag anything over $10k.
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-md bg-[hsl(147_66%_39%/0.1)] px-2 py-1 font-mono-label text-[9px] text-[hsl(147_66%_28%)]">
          Changed
        </span>
        <span className="text-[12px] text-muted-foreground">while you watched</span>
      </div>
    </Plate>
  );
}

function LiveMoment() {
  return (
    <Plate>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="dash-live-dot h-1.5 w-1.5 rounded-full bg-[hsl(147_66%_39%)]" />
          <span className="text-[13px] font-semibold">Live</span>
        </div>
        <Mono className="text-muted-foreground">Training done · we keep it running</Mono>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {[
          ["312", "Hours back"],
          ["476", "Invoices filed"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-xl bg-[hsl(220_24%_97%)] px-3.5 py-3">
            <div className="font-heading text-[1.6rem] font-semibold tracking-tight">{n}</div>
            <Mono className="text-muted-foreground">{l}</Mono>
          </div>
        ))}
      </div>
    </Plate>
  );
}

const MOMENTS = [CallMoment, DiveMoment, PlanMoment, BuildMoment, ReviewMoment, LiveMoment];

export function TimelineMoment({ index }: { index: number }) {
  const Node = MOMENTS[index] ?? CallMoment;
  return <Node />;
}
