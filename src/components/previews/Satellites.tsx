import type { ReactNode } from "react";
import { CalendarDays, Check, ChevronRight, MessageSquare, MoreHorizontal, Users } from "lucide-react";

/*
  Small, static "app moment" cards for the closing desk of the handoff stage:
  what the surrounding tools look like once the automations are running. No
  state, no timers; each is rasterized once and then only composited.
*/

const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-mono-label text-[9px] ${className}`}>{children}</span>
);

function Frame({
  logo,
  title,
  children,
}: {
  logo: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="hairline soft-shadow-lg overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-2 border-b border-[hsl(220_20%_92%)] bg-[hsl(220_24%_97%)] px-3 py-2">
        <img src={`/logos/${logo}.webp`} alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
        <span className="text-[11px] font-medium text-[hsl(222_10%_35%)]">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function SlackCard() {
  return (
    <Frame logo="slack" title="#sales-leads">
      <div className="flex gap-2.5 px-3.5 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(222_84%_53%)]">
          <img src="/favicon.svg?v=4" alt="" className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Applied bot</span>
            <Mono className="text-[hsl(222_10%_55%)]">9:41 AM</Mono>
          </div>
          <p className="mt-0.5 text-[12px] leading-[1.45] text-[hsl(223_14%_20%)]">
            New lead routed to <span className="rounded bg-[hsl(222_84%_53%/0.1)] px-1 text-[hsl(222_84%_45%)]">@jordan</span>: Maya Thompson, web form, score 92. First text sent in 45s.
          </p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-md border border-[hsl(220_20%_90%)] px-1.5 py-0.5 text-[10px]">👍 2</span>
            <span className="rounded-md border border-[hsl(220_20%_90%)] px-1.5 py-0.5 text-[10px]">🚀 1</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

type DeskStoryProps = {
  play?: boolean;
  compact?: boolean;
};

export function CalendarCard({ play = false, compact = false }: DeskStoryProps) {
  return (
    <div
      className="desk-calendar relative overflow-visible"
      data-play={play ? "" : undefined}
      data-compact={compact ? "" : undefined}
    >
      <div className="hairline soft-shadow-lg rounded-2xl bg-white">
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(222_84%_53%/0.12)]">
            <CalendarDays size={13} strokeWidth={2.2} className="text-[hsl(222_84%_48%)]" />
          </span>
          <span className="text-[13px] font-semibold text-[hsl(223_14%_10%)]">Thu, Sep 11</span>
          <ChevronRight size={14} strokeWidth={2.2} className="text-[hsl(222_10%_55%)]" />
        </div>
        <div className="grid grid-cols-[44px_1fr] gap-x-2 px-3 pb-3">
          {[
            { t: "2 PM", ev: { title: "Roof quote · Lena Ortiz", sub: "410 Nueces St · booked by agent", color: "222 84% 53%", booked: true } },
            { t: "3 PM", ev: { title: "Water heater swap", sub: "Crew: Omar K.", color: "174 62% 40%" } },
          ].map((row) => (
            <div key={row.t} className="contents">
              <Mono className="pt-2.5 text-right text-[hsl(222_10%_55%)]">{row.t}</Mono>
              <div className="min-h-[44px] py-1.5">
                <div
                  className={`relative rounded-lg border-l-[3px] px-2.5 py-1.5${row.ev.booked ? " desk-appt" : ""}`}
                  style={{ borderColor: `hsl(${row.ev.color})`, background: `hsl(${row.ev.color} / 0.08)` }}
                >
                  {row.ev.booked && <span aria-hidden className="desk-appt-flash" />}
                  <div className="relative text-[12px] font-semibold text-[hsl(223_14%_10%)]">{row.ev.title}</div>
                  <div className="relative text-[10.5px] text-[hsl(222_10%_45%)]">{row.ev.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="desk-mascot-seat" aria-hidden="true">
        <img
          src="/robots/robot-dispatch.webp"
          alt=""
          draggable={false}
          className="desk-mascot"
        />
      </span>
    </div>
  );
}

export function SheetsCard() {
  const rows = [
    ["Maya Thompson", "Web form", "92", "Jordan"],
    ["Carlos Reyes", "Google Ads", "81", "Priya"],
    ["Dana Whitfield", "Phone", "77", "Sam"],
    ["Lena Ortiz", "Referral", "88", "Jordan"],
  ];
  const bars = [5, 8, 6, 10, 7, 12, 9, 14, 11, 16, 12, 15];
  return (
    <div className="hairline soft-shadow-lg overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(147_66%_39%/0.14)]">
          <Users size={13} strokeWidth={2.2} className="text-[hsl(147_66%_32%)]" />
        </span>
        <span className="text-[13px] font-semibold text-[hsl(223_14%_10%)]">Leads</span>
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-left">
            {["Name", "Source", "Score", "Owner"].map((h) => (
              <th key={h} className="border-b border-[hsl(220_20%_92%)] px-3 py-1.5 font-mono-label text-[8.5px] font-medium uppercase tracking-wide text-[hsl(222_10%_50%)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-[hsl(220_20%_94%)] last:border-0">
              <td className="px-3 py-1.5 font-medium text-[hsl(223_14%_10%)]">{r[0]}</td>
              <td className="px-3 py-1.5 text-[hsl(222_10%_45%)]">{r[1]}</td>
              <td className="px-3 py-1.5">
                <span className="rounded-full bg-[hsl(147_66%_39%/0.12)] px-1.5 py-0.5 font-mono-label text-[9px] text-[hsl(147_66%_28%)]">{r[2]}</span>
              </td>
              <td className="px-3 py-1.5 text-[hsl(222_10%_45%)]">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-end justify-between gap-3 border-t border-[hsl(220_20%_92%)] px-3.5 py-2.5">
        <div className="flex h-7 items-end gap-[3px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[5px] rounded-[2px] bg-[hsl(222_84%_53%)]"
              style={{ height: `${h * 1.7}px`, opacity: 0.35 + (i / bars.length) * 0.65 }}
            />
          ))}
        </div>
        <div className="text-right">
          <div className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">128</div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px] text-[hsl(222_10%_50%)]">Leads this month</span>
            <span className="font-mono-label text-[9px] text-[hsl(147_66%_32%)]">↑ 24%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SmsCard({ play = false, compact = false }: DeskStoryProps) {
  return (
    <div
      className="desk-sms relative overflow-visible"
      data-await={compact ? undefined : ""}
      data-play={play ? "" : undefined}
      data-compact={compact ? "" : undefined}
    >
      <div className="hairline soft-shadow-lg rounded-2xl bg-white">
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(147_66%_39%/0.14)]">
            <MessageSquare size={13} strokeWidth={2.2} className="text-[hsl(147_66%_32%)]" />
          </span>
          <span className="text-[13px] font-semibold text-[hsl(223_14%_10%)]">Messages</span>
          <MoreHorizontal size={15} strokeWidth={2} className="ml-auto text-[hsl(222_10%_55%)]" />
        </div>
        <div className="space-y-2.5 px-3.5 pb-3.5">
          <div className="desk-sms-bubble flex items-end justify-start gap-2">
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-[hsl(220_20%_94%)] px-3 py-2 text-[12px] leading-[1.4] text-[hsl(223_14%_12%)]">
            Is the estimate from last week still valid?
            </div>
            <Mono className="mb-0.5 shrink-0 text-[hsl(222_10%_55%)]">10:24 AM</Mono>
          </div>
          <div className="desk-sms-bubble flex items-end justify-end gap-2">
            <Mono className="mb-0.5 shrink-0 text-[hsl(222_10%_55%)]">10:25 AM</Mono>
            <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[hsl(222_84%_53%)] px-3 py-2 text-[12px] leading-[1.4] text-white">
              Yes, valid through Sep 30. Want me to book the crew for Tuesday?
            </div>
          </div>
          <div className="desk-sms-bubble flex items-end justify-start gap-2">
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-[hsl(220_20%_94%)] px-3 py-2 text-[12px] text-[hsl(223_14%_12%)]">
              Yes please
        </div>
            <Mono className="mb-0.5 shrink-0 text-[hsl(222_10%_55%)]">10:26 AM</Mono>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickBooksCard() {
  return (
    <Frame logo="quickbooks" title="Bills · Accounts payable">
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Brightline Supply Co</div>
            <Mono className="text-[hsl(222_10%_55%)]">INV-20488 · due Sep 19</Mono>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-semibold tracking-tight text-[hsl(223_14%_10%)]">$4,820.00</div>
            <Mono className="text-[hsl(222_10%_55%)]">JOB-7731</Mono>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[hsl(147_66%_39%/0.1)] px-2.5 py-1.5">
          <Check size={11} strokeWidth={3} className="text-[hsl(147_66%_30%)]" />
          <Mono className="text-[hsl(147_66%_28%)]">FILED BY AUTOMATION · 2 MIN AGO</Mono>
        </div>
      </div>
    </Frame>
  );
}

export function DocuSignCard() {
  return (
    <Frame logo="docusign" title="Contract_7731.pdf">
      <div className="px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[hsl(223_14%_10%)]">Roofing agreement</span>
          <span className="rounded-full bg-[hsl(147_66%_39%/0.12)] px-2 py-0.5 font-mono-label text-[9px] text-[hsl(147_66%_28%)]">COMPLETED</span>
        </div>
        {[
          { who: "Lena Ortiz", when: "Signed · Sep 9, 10:12 AM" },
          { who: "Applied Systems", when: "Signed · Sep 9, 10:14 AM" },
        ].map((s) => (
          <div key={s.who} className="flex items-center gap-2 border-t border-[hsl(220_20%_93%)] py-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(147_66%_39%)]">
              <Check size={10} strokeWidth={3} className="text-white" />
            </span>
            <span className="text-[11px] font-medium text-[hsl(223_14%_10%)]">{s.who}</span>
            <Mono className="ml-auto text-[hsl(222_10%_55%)]">{s.when}</Mono>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export const SATELLITE_CARDS = {
  slack: SlackCard,
  calendar: CalendarCard,
  sheets: SheetsCard,
  sms: SmsCard,
  quickbooks: QuickBooksCard,
  docusign: DocuSignCard,
} as const;
