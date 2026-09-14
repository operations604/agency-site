# Task: replace Calendly with a first-party booking calendar

Build a custom scheduling UI for the Applied Systems site and remove Calendly from the
codebase completely.

**This is phase 1 of two, and phase 1 is frontend only.**

- **Phase 1 (this task)** — the full booking experience, built against a defined API
  contract with a mock adapter behind it. Calendly deleted. Every state clickable.
- **Phase 2 (later, not now)** — a small server holds the secrets, writes bookings to
  Supabase, and creates the Google Calendar event + Meet link. Specified in §7 so phase 1
  builds the right shape. Do not implement it.

Read `CONTEXT.md` in full first and follow its rules: only change what is asked, never
touch `agency-site-base`, do not commit or push unless asked, verify in the browser after
UI work, compositor-only motion.

---

## Why phase 1 is frontend only

Creating a calendar event and a Meet link **on my calendar** means authenticating as me —
a Google client secret plus a refresh token. Anything in a Vite bundle is public, so those
credentials cannot ship to the browser. Zoom has the identical constraint. That work needs
a server, the server does not exist yet, so it is deferred rather than faked.

**The consequence, stated plainly: once Calendly is deleted and until phase 2 ships, a
booking made on this site goes nowhere.** No database, no calendar, no email. See question
3 in §0 — that is a decision I need to make, not something to paper over.

---

## 0. Confirm these before writing code

Ask me in one batch, then proceed. Defaults in brackets if I do not care.

1. **Business timezone and working hours** — e.g. `America/New_York`, Mon–Fri 09:00–17:00.
2. Meeting length stays **30 minutes**? Plus: buffer between calls [15 min], minimum
   notice before a slot is bookable [12 h], how far ahead the calendar opens [30 days].
3. **Between phase 1 and phase 2, what happens to a real booking?** Either (a) this stays
   on my machine and is not deployed until phase 2, or (b) add an interim no-secret
   fallback so the lead at least reaches an inbox — a form-to-email endpoint needs no
   server and no credentials, and gets torn out in phase 2. Tell me which.
4. Should the UI include **reschedule / cancel**, or is that phase 2?

Google account type and where the server lives are phase 2 questions. Do not ask now.

---

## 1. Remove Calendly completely

Delete every trace of our own Calendly integration:

- **Delete `src/lib/calendly.ts`** — `CALENDLY_URL`, the script loader, `openCalendly()`,
  and the `Window.Calendly` global declaration.
- **`src/components/sections/Booking.tsx`** — currently lazy-loads the Calendly inline
  widget on scroll behind a skeleton. Rewrite it to render the new calendar. **Keep** the
  `id="book"` anchor, the heading "Tell us what is eating your time.", the subcopy, and
  the unboxed treatment (the widget sits directly on the page background, no card chrome).
- **`src/components/ui/BookCallButton.tsx`** — drop the `openCalendly()` popup. The button
  smooth-scrolls to `#book` and moves focus into the calendar. Keep its exact visual
  design, variants, and motion — only the click behaviour changes. Used by
  `src/components/nav/Nav.tsx:51`, `src/components/hero/Hero.tsx:76`,
  `src/components/sections/Pricing.tsx:219`.
- **`src/components/sections/Footer.tsx:49`** — same treatment, scroll to `#book`.
- Remove the `assets.calendly.com` stylesheet and script injection entirely. Nothing
  should reach Calendly's domain after this task.

**One deliberate exception:** the `"calendly"` logo tile in
`src/components/sections/HoneycombStrip.tsx:22` and the Calendly lines in
`src/content/feed.ts` (79, 132) are integration-logo content about tools we automate for
clients — they sit alongside Supabase, Notion, and Airtable. Leave them. If I actually
wanted those gone too, I will say so.

---

## 2. The API contract — write this first

Everything else in phase 1 is built against this. Put it in `src/lib/booking-api.ts` as
types plus a `BookingApi` interface. Phase 2 swaps the implementation and changes nothing
else.

```ts
export type Slot = { startsAt: string; endsAt: string };   // UTC ISO

export type AvailabilityQuery = { from: string; to: string; timezone: string };

export type AvailabilityResult = {
  businessTimezone: string;
  slotMinutes: number;
  slots: Slot[];
};

export type BookingRequest = {
  startsAt: string;
  timezone: string;
  locale: string;
  lead: {                 // see §4
    name: string; email: string; company: string; painPoint: string;
    website?: string; role?: string; phone?: string; teamSize?: string;
    tools?: string[]; hoursLostWeekly?: string; budgetBand?: string;
    urgency?: string; heardFrom?: string; notes?: string;
  };
  context: {              // captured silently
    utm: Record<string, string>; referrer: string; landingPath: string;
  };
};

export type BookingResult =
  | { ok: true; bookingId: string; startsAt: string; endsAt: string;
      meetUrl: string | null; manageToken: string }
  | { ok: false; code: 'slot_taken' | 'invalid' | 'rate_limited' | 'server_error';
      message: string; fieldErrors?: Record<string, string> };

export interface BookingApi {
  getAvailability(q: AvailabilityQuery): Promise<AvailabilityResult>;
  book(req: BookingRequest): Promise<BookingResult>;
}
```

Rules that keep phase 2 cheap:

- All timestamps cross the boundary as **UTC ISO strings**. Convert for display only.
- `meetUrl` is nullable from day one — phase 2 must be able to save a booking even when
  Google fails. The UI must already handle a confirmation with no link.
- Errors are returned as typed results, not thrown. Only transport failures throw.
- **No component may call `fetch` directly.** Everything goes through the interface.

---

## 3. The mock adapter (phase 1's only implementation)

`src/lib/booking-api.mock.ts`, selected when `VITE_BOOKING_API_URL` is unset. Add
`.env.example` and confirm `.env` is gitignored.

- Generates slots from the §0 rules: working hours in the business timezone, honoring slot
  length, buffer, minimum notice, and the booking window. Weekends closed.
- Persists bookings to `localStorage` so a booked slot disappears and stays gone on
  reload — that makes the real behaviour visible while demoing.
- Simulates 400–900 ms of latency so loading states are real, not theoretical.
- **Forceable failures for testing**, via query param: `?mockfail=slot_taken`,
  `?mockfail=server_error`, `?mockfail=network`, `?mockfail=nomeet` (success with
  `meetUrl: null`). Every state in §5 must be reachable without editing code.
- Returns an obviously-fake `meetUrl` on success (`https://meet.google.com/mock-xxxx-dev`).
- **The confirmation screen must not claim an email was sent while the mock is active.**
  Do not lie to a visitor in the UI.

Stub `src/lib/booking-api.http.ts` implementing the same interface against
`VITE_BOOKING_API_URL` — leave the request bodies and typed error mapping written, so
phase 2 is a URL and a deploy. Do not invent auth headers.

---

## 4. What the form captures — this is the point of owning it

The site's own promise is *"Tell us what is eating your time"*, so the form should arrive
at the call already answering it.

**Required (four, and no more)**: full name · work email · company ·
**"What's eating your time?"** (textarea — the primary qualifier).

**Optional, in a tighter second group**: website · role/title · team size (band) · tools
they run on (multi-select chips seeded from the Honeycomb logo list — Salesforce, HubSpot,
QuickBooks, Sheets, Notion, Airtable, Slack, Xero, Pipedrive, "other") · hours/week lost
to that work (band) · budget band · urgency ("this quarter" / "next quarter" /
"exploring") · phone · how they heard about us.

**Captured silently**: visitor timezone, locale, UTM params, referrer, landing path. Never
shown as fields.

Include a honeypot field and record time-to-submit in the payload — phase 2's server needs
both to throttle spam, and retrofitting them into a form is annoying.

Every extra required field costs bookings. Keep it at four.

---

## 5. The UI — this has to out-class Calendly

New `src/components/booking/`: `BookingCalendar.tsx`, `MonthGrid.tsx`, `TimeList.tsx`,
`DetailsForm.tsx`, `Confirmation.tsx`, `useAvailability.ts`, `types.ts`.

**Design tokens — match exactly, no new colors**: `--primary 222 84% 53%`,
`--background 220 40% 98%`, `--card 0 0% 100%`, `--muted 220 24% 95%`,
`--border 220 20% 90%`, `--foreground 224 30% 12%`. Inter Tight for headings, Inter for
body, JetBrains Mono for date/time labels (`.font-mono-label` already exists). Reuse the
hairline and shadow utilities in `src/index.css`.

**Layout**
- ≥900px: month grid left, times for the selected day right, hairline divider between.
- <900px: month grid, then times slide up beneath it.
- Widen past `max-w-[640px]` — that cap existed only to force Calendly's borderless
  layout. `max-w-[880px]` for the two-pane view.

**Flow**: three steps with a quiet mono step indicator — *Pick a time → Your details →
Confirmed*. The selected date and time stay pinned and visible during step 2 so nobody
loses their place.

**Motion** (matching `BookCallButton`): 0.18–0.28s, `ease: [0.22, 1, 0.36, 1]`, transform
and opacity only, `will-change: transform, opacity`. No per-frame `filter: blur()`, no
`mix-blend-mode` on animated layers. Days fade-stagger on month change, time pills stagger
in, steps cross-fade with a small y-offset. Honor `prefers-reduced-motion` with plain fades.

**Keep the lazy behaviour** the Calendly embed had — the calendar mounts when the section
nears the viewport, behind the existing skeleton language, so initial page load does not
regress.

**Timezone**: detect via `Intl.DateTimeFormat().resolvedOptions().timeZone`, show
"Times shown in {zone}" under the grid with a searchable override select, re-render slots
on change.

**Every state, designed — not an afterthought**
- Loading: the existing skeleton language, on the real grid shape.
- Day with no slots: quiet line plus a "Jump to {next available day}" action.
- Whole range empty: "Nothing open in the next N days — email us", with a mailto.
- Submitting: button spinner, form locked, no double submit.
- Slot taken mid-form: inline message, refresh availability, **keep every field already
  typed**. Losing their answers here is the worst possible bug in this feature.
- Network error: message plus retry, fields preserved.
- Success **with** a link: date, time in their timezone, copyable meeting link, and
  `.ics` / Google / Outlook add-to-calendar links.
- Success **without** a link (`meetUrl: null`): same confirmation, wording that promises
  nothing that was not sent — "We'll email your meeting link shortly."

**Accessibility**: month grid is `role="grid"` with roving tabindex and arrow-key /
PageUp / PageDown / Home / End navigation; `aria-selected` and `aria-disabled` on days;
every input labelled; errors tied via `aria-describedby`; step changes announced in an
`aria-live="polite"` region; visible focus via `ring-ring`; a complete keyboard path from
first day to confirmation. Verify with the keyboard, not by eye.

---

## 6. Verify before calling phase 1 done

- `npm run lint` and `npm run build` both clean (`tsc -b` included).
- Dev server at `http://127.0.0.1:5173/` — actually drive the booking in the browser.
  Behaviour, not a screenshot.
- Walk **every** state in §5 using the `?mockfail=` params. All eight.
- Book a slot, reload, confirm it is gone from the grid.
- Every Book-a-call button — nav, hero, pricing, footer — scrolls to `#book` and lands
  focus in the calendar.
- Mobile viewport (375px) and the full keyboard path.
- **`grep -ri calendly dist/ src/` returns only the Honeycomb logo tile and the two
  `feed.ts` lines.** Nothing else, and no network request to `assets.calendly.com`.

---

## 7. Phase 2 — specified, NOT to be built now

Recorded so phase 1 builds the right shape. Do not implement, scaffold, or install
dependencies for it.

**Server** — host TBD (Cloudflare Worker on the same origin as the static site, or a small
Node service on the Hostinger VPS). Holds every secret. Implements the two §2 endpoints.

**Supabase** — `bookings` (scheduling fields, the §4 lead fields, context,
`google_event_id`, `meet_url`, `manage_token`, status), `availability_rules`,
`availability_overrides`, `booking_settings`, `booking_rate_limits`. RLS on with **no anon
policies** — the server uses the service-role key. Double-booking is prevented by the
database, not application logic:

```sql
create unique index bookings_one_per_slot
  on bookings (starts_at)
  where status in ('pending','confirmed','needs_manual_invite');
```

Catch the unique violation and map it to `code: 'slot_taken'`.

**Google Calendar + Meet** — OAuth2 refresh token for the owner's account, scope
`https://www.googleapis.com/auth/calendar`, obtained once locally with
`access_type=offline&prompt=consent`. **Publish the OAuth app to Production** — refresh
tokens for apps left in "Testing" expire after 7 days, so the calendar would work at
launch and silently die a week later. Query `freeBusy` when computing availability so
slots blocked on the real calendar never appear. Create events with
`?conferenceDataVersion=1&sendUpdates=all` and `conferenceData.createRequest`
(`conferenceSolutionKey.type = "hangoutsMeet"`); read `hangoutLink` off the response.
`sendUpdates=all` is what emails the invite.

**If Google fails**: keep the booking, mark it `needs_manual_invite`, notify the owner,
return `ok: true` with `meetUrl: null`. Never lose a lead because Google returned a 500.

**Cutover**: set `VITE_BOOKING_API_URL`, delete the mock adapter, remove any interim
fallback from §0.3.

---

## 8. Ground rules

- Do not touch `agency-site-base`, `HeroScene`, `HandoffStage`, or `CompanyDashboard.tsx`.
- Do not change brand tokens, pricing, or site copy outside the booking section.
- Do not commit, push, or deploy unless I ask.
- No new runtime dependencies without asking. Timezone math with `Intl`, or propose
  `date-fns-tz` and wait.
- Tell me in plain language what you did and anything you had to decide on your own.
