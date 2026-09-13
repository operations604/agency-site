// Content for the live ops feed. A scripted composite of a typical Monday
// across client systems, not real telemetry; the section copy says so.

export type FeedEvent =
  | { kind: "event"; logo: string; text: string; time: string }
  | { kind: "quote"; text: string; who: string };

export const EVENTS: FeedEvent[] = [
  { kind: "event", logo: "quickbooks", text: "INV-4821 Acme Supply filed to QuickBooks", time: "08:02" },
  { kind: "event", logo: "hubspot", text: "New lead J. Alvarez qualified and routed to Sales", time: "08:03" },
  { kind: "event", logo: "google-calendar", text: "M. Chen booked · Tuesday 2:00 pm", time: "08:03" },
  { kind: "event", logo: "google-drive", text: "14 files named and sorted → Clients / Acme", time: "08:05" },
  {
    kind: "quote",
    text: "I stopped opening the spreadsheet. It just happens now.",
    who: "Operations lead, 40-person logistics company",
  },
  { kind: "event", logo: "slack", text: "Approval requested in #finance · $12,000 · Contoso", time: "08:07" },
  { kind: "event", logo: "docusign", text: "Signed MSA filed, renewal reminder set for Aug 2027", time: "08:09" },
  { kind: "event", logo: "twilio", text: "Agent rebooked D. Park by SMS · Thursday 10:30", time: "08:11" },
  { kind: "event", logo: "zendesk", text: "#5514 escalated to Sam with a summary attached", time: "08:12" },
  { kind: "event", logo: "xero", text: "Month-end checklist · 9 of 11 done", time: "08:14" },
  {
    kind: "quote",
    text: "Three weeks. The first version replaced two hires we were about to make.",
    who: "Founder, home services",
  },
  { kind: "event", logo: "google-sheets", text: "Monday pipeline report sent to 4 people", time: "08:15" },
  { kind: "event", logo: "stripe", text: "Failed payment retried · $480 recovered", time: "08:16" },
  { kind: "event", logo: "gmail", text: "38 vendor emails read, 0 opened by a person", time: "08:18" },
  { kind: "event", logo: "notion", text: "Client onboarding page created from the signed contract", time: "08:20" },
  {
    kind: "quote",
    text: "One person runs it. It used to be a department's worth of copy-paste.",
    who: "COO, regional insurance agency",
  },
];

export const STATS = [
  { value: 3100, suffix: "+", label: "Hours back per month" },
  { value: 12400, suffix: "+", label: "Tasks run without a person" },
  { value: 40, suffix: "+", label: "Systems shipped" },
  { value: 0, suffix: "", label: "Seat licenses sold" },
];
