// Content for the live ops feed. A scripted composite of a typical morning
// across client systems, not real telemetry; the section copy says so.
//
// Each turn is one instruction somebody types, followed by the work that runs
// off the back of it. The feed plays turns in order and loops.

export type FeedResult = { logo: string; text: string };
export type FeedTurn = { prompt: string; results: FeedResult[] };

export const TURNS: FeedTurn[] = [
  {
    prompt: "file the Acme invoice and set the renewal reminder",
    results: [
      { logo: "quickbooks", text: "INV-4821 Acme Supply filed" },
      { logo: "docusign", text: "Signed MSA stored, renewal set for Aug 2027" },
      { logo: "slack", text: "Approval requested in #finance · $12,000" },
    ],
  },
  {
    prompt: "qualify the overnight leads and route them",
    results: [
      { logo: "hubspot", text: "J. Alvarez qualified and routed to Sales" },
      { logo: "apollo", text: "Company enriched · 120 staff, Series B" },
      { logo: "google-calendar", text: "M. Chen booked · Tuesday 2:00 pm" },
    ],
  },
  {
    prompt: "chase this week's failed payments",
    results: [
      { logo: "stripe", text: "Failed payment retried · $480 recovered" },
      { logo: "chargebee", text: "2 dunning emails scheduled" },
      { logo: "xero", text: "Ledger reconciled to today" },
    ],
  },
  {
    prompt: "summarise ticket 5514 and escalate it",
    results: [
      { logo: "zendesk", text: "#5514 escalated to Sam with a summary" },
      { logo: "linear", text: "ENG-812 opened and linked to the ticket" },
      { logo: "slack", text: "Thread posted to #support-escalations" },
    ],
  },
  {
    prompt: "send the Monday pipeline report",
    results: [
      { logo: "google-sheets", text: "Pipeline pulled · 42 open deals" },
      { logo: "gmail", text: "Report sent to 4 people" },
      { logo: "notion", text: "Weekly summary page updated" },
    ],
  },
  {
    prompt: "onboard Acme from the signed contract",
    results: [
      { logo: "notion", text: "Onboarding page created from the contract" },
      { logo: "asana", text: "11 kickoff tasks assigned" },
      { logo: "google-drive", text: "14 files named and sorted → Clients / Acme" },
    ],
  },
  {
    prompt: "read the vendor inbox, flag anything urgent",
    results: [
      { logo: "gmail", text: "38 vendor emails read, 0 opened by a person" },
      { logo: "microsoft-outlook", text: "2 flagged urgent, the rest filed" },
      { logo: "todoist", text: "3 follow-ups scheduled" },
    ],
  },
  {
    prompt: "close out month-end",
    results: [
      { logo: "xero", text: "Month-end checklist · 9 of 11 done" },
      { logo: "quickbooks", text: "Journal entries posted" },
      { logo: "dropbox", text: "Statements archived by client" },
    ],
  },
  {
    prompt: "rebook Thursday's no-shows",
    results: [
      { logo: "twilio", text: "D. Park rebooked by SMS · Thursday 10:30" },
      { logo: "google-calendar", text: "2 slots released back to the calendar" },
    ],
  },
  {
    prompt: "handle the overnight form fills",
    results: [
      { logo: "typeform", text: "9 responses parsed" },
      { logo: "hubspot", text: "Contacts created and deduped" },
      { logo: "gmail", text: "Replies drafted and sent" },
    ],
  },
  {
    prompt: "check the overnight sync errors",
    results: [
      { logo: "postgres", text: "3 rows repaired in the orders table" },
      { logo: "datadog", text: "Alert cleared, no customer impact" },
    ],
  },
  {
    prompt: "prep tomorrow's install schedule",
    results: [
      { logo: "monday", text: "7 jobs sequenced by drive time" },
      { logo: "twilio", text: "Confirmations sent to 7 customers" },
      { logo: "google-sheets", text: "Route sheet shared with the crew" },
    ],
  },
  {
    prompt: "reconcile the card statements",
    results: [
      { logo: "xero", text: "84 transactions matched to receipts" },
      { logo: "dropbox", text: "Unmatched items flagged for review" },
    ],
  },
  {
    prompt: "follow up on last week's quotes",
    results: [
      { logo: "pandadoc", text: "6 quotes re-sent with a nudge" },
      { logo: "pipedrive", text: "2 marked won, moved to onboarding" },
    ],
  },
  {
    prompt: "sort out the duplicate contacts",
    results: [
      { logo: "hubspot", text: "312 duplicates merged" },
      { logo: "mailchimp", text: "Audience re-synced" },
    ],
  },
  {
    prompt: "turn the call recording into next steps",
    results: [
      { logo: "zoom", text: "Call transcribed · 38 minutes" },
      { logo: "asana", text: "5 action items assigned with dates" },
    ],
  },
  {
    prompt: "get the new starter set up",
    results: [
      { logo: "bamboohr", text: "Offer letter issued and countersigned" },
      { logo: "google-drive", text: "Accounts and folders provisioned" },
      { logo: "slack", text: "Intro posted to #team" },
    ],
  },
  {
    prompt: "find out why churn moved last month",
    results: [
      { logo: "posthog", text: "Cohort pulled · 22 cancellations" },
      { logo: "notion", text: "Findings written up with the top three reasons" },
    ],
  },
];

// Work that runs on its own, with nobody prompting it. These stream in
// continuously; the typed turns above interject every few events.
export const AMBIENT: FeedResult[] = [
  { logo: "stripe", text: "Subscription renewed · Northwind $1,200" },
  { logo: "quickbooks", text: "Bill matched to PO-2291" },
  { logo: "shopify", text: "Order #10442 routed to fulfilment" },
  { logo: "gmail", text: "Out-of-office replies filed, 4 handed off" },
  { logo: "slack", text: "Daily standup summary posted to #ops" },
  { logo: "google-calendar", text: "3 double-bookings resolved" },
  { logo: "hubspot", text: "Deal stage updated from the call notes" },
  { logo: "zendesk", text: "12 tickets tagged and assigned" },
  { logo: "xero", text: "Bank feed reconciled · 64 lines" },
  { logo: "twilio", text: "Appointment reminders sent to 18 customers" },
  { logo: "docusign", text: "Contract countersigned and filed" },
  { logo: "asana", text: "Overdue tasks nudged to their owners" },
  { logo: "notion", text: "Meeting notes written from the transcript" },
  { logo: "google-drive", text: "Receipts filed by vendor and month" },
  { logo: "airtable", text: "Inventory synced from the supplier feed" },
  { logo: "intercom", text: "9 chats answered without a handoff" },
  { logo: "monday", text: "Job board reordered for tomorrow" },
  { logo: "pipedrive", text: "Stale deals flagged for follow-up" },
  { logo: "mailchimp", text: "Segment rebuilt · 2,410 contacts" },
  { logo: "linear", text: "Bug triaged and pointed" },
  { logo: "github", text: "Release notes drafted from merged PRs" },
  { logo: "jira", text: "Sprint report compiled" },
  { logo: "google-calendar", text: "Buffer added around site visits" },
  { logo: "dropbox", text: "Photos sorted into the job folder" },
  { logo: "square", text: "Tips reconciled for payroll" },
  { logo: "paypal", text: "Refund processed · $89" },
  { logo: "trello", text: "Checklist cloned for the new client" },
  { logo: "microsoft-teams", text: "Escalation posted to the on-call channel" },
  { logo: "zoom", text: "Recording transcribed and summarised" },
  { logo: "typeform", text: "Survey responses scored" },
  { logo: "klaviyo", text: "Win-back flow triggered for 38 buyers" },
  { logo: "pandadoc", text: "Quote generated and sent" },
  { logo: "freshdesk", text: "SLA breach prevented on 2 tickets" },
  { logo: "postgres", text: "Nightly backup verified" },
  { logo: "sendgrid", text: "Bounced addresses cleaned from the list" },
  { logo: "wrike", text: "Handover checklist marked complete" },
  { logo: "ringcentral", text: "Missed call returned by SMS" },
  { logo: "bamboohr", text: "New starter paperwork issued" },
];

// perMinute: how much the figure climbs per minute while the section is on
// screen. Zero for counts that do not move on that timescale.
export type FeedStat = {
  value: number;
  suffix: string;
  label: string;
  perMinute: number;
};

export const STATS: FeedStat[] = [
  { value: 3100, suffix: "+", label: "Hours back per month", perMinute: 22 },
  { value: 12400, suffix: "+", label: "Tasks run without a person", perMinute: 140 },
  { value: 40, suffix: "+", label: "Systems shipped", perMinute: 0 },
  { value: 4800, suffix: "+", label: "Documents processed", perMinute: 58 },
];
