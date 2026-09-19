# Applied Systems — site context

Read this entire file before changing anything. Then wait for the user.

Do not start redesigning How it works, opening Lavish, or shipping UI until they tell you to.

This is the marketing site for **Applied Systems**: custom software and automation for real businesses. Premium, operator-facing.

---

## Where it lives

- Live project (source of truth): `/Users/dariangray/Downloads/fincore-2/agency-site`
- Backup, never edit: `/Users/dariangray/Downloads/fincore-2/agency-site-base`
- Dev server: `npm run dev` → **http://127.0.0.1:5173/** (`vite.config.ts` binds `127.0.0.1:5173`, `strictPort: true`)
- Git root is the parent `fincore-2` repo (`origin`: `https://github.com/operations604/fincore.git`), not this folder alone
- Do not look under `~/fincore-2` unless that path is the same Downloads copy

---

## Stack

Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion.

- Theme, fonts, shared animation CSS: `src/index.css`
- Fonts: **Inter**, **Inter Tight**, **JetBrains Mono**
- Lucide is aliased to `src/lib/icons.ts` — **do not delete that alias**
- Lint: `oxlint`. Build: `tsc -b && vite build && node server/compress-static.mjs`

### Brand tokens

```
--background: 220 40% 98%
--foreground: 224 30% 12%
--card: 0 0% 100%
--primary: 222 84% 53%     ← main business color
--muted: 220 24% 95%
--muted-foreground: 222 14% 42%
--border: 220 20% 90%
```

Product interiors also use a warmer hairline `hsl(38 21% 90%)` and live-green `hsl(147 66% 39%)`.

Logo: blue rounded square, thick white “A” with no crossbar (two-stroke Λ). Favicon `/favicon.svg?v=4`.

Headline: “Custom software and automation, built around your business.”

Copy voice: direct, operator-facing. Automating *with* their tools, not “powered by” them. Buyer language: **you / your week / your tools**. No invented employees. No date promises.

---

## Page order

`src/App.tsx` → `src/pages/Home.tsx` only. One page.

1. `Nav`
2. `HeroScene` — mesh + Mac boot + company dashboard
3. `HandoffStage` — pinned scroll stage; product windows (LeadPipeline, InvoiceExtraction, OpsDashboard, AgentInbox)
4. `HoneycombStrip` — hex logo grid, “80+ connections”
5. `BuildTimeline` — How it works. `id="how-it-works"`
6. `LiveFeed` — ops log + stats
7. `Pricing`
8. `Booking`
9. `Footer`

---

## Files

```
src/pages/Home.tsx                         page order
src/index.css                              tokens, hairline, shadows, motion
src/content/timeline.ts                    six steps + copy
src/content/feed.ts                        live ops feed
src/components/sections/BuildTimeline.tsx  live How it works section
src/components/previews/TimelineMoments.tsx live plates for that section
src/components/sections/HandoffStage.tsx
src/components/previews/LeadPipeline.tsx
src/components/previews/InvoiceExtraction.tsx
src/components/previews/OpsDashboard.tsx
src/components/previews/AgentInbox.tsx
src/components/previews/Satellites.tsx
src/components/sections/LiveFeed.tsx
src/components/sections/HoneycombStrip.tsx
src/components/nav/                        Nav, Logo
src/components/hero/                       Hero, HeroScene, MacBoot, MeshField
src/components/dashboard/CompanyDashboard.tsx  keep as one file
src/components/ui/                         BookCallButton, PreviewCard
src/lib/                                   booking-api.ts, animations.ts, icons.ts
public/logos/                              lossless WebP tiles used by the site
source-assets/                             original PNG source artwork, not deployed
public/favicon.svg
.lavish/process-directions.html            Lavish review board
.lavish/graphics.js
.lavish/logos/                             relative paths logos/*.png, never /logos/
```

The stage shows what Applied builds: lead routing, document processing, ops dashboard, agent inbox. How it works is the engagement — how we work with you.

---

## How it works

A **timeline**. Six even stations. Graphics / motion pop on the live stop.

Copy is in `src/content/timeline.ts`. Keep these six steps. No dates.

1. **The call** — You walk us through the week. We find the work that shouldn't be done by hand.
2. **The deep dive** — We sit with the people who do the work and watch how the week actually runs.
3. **The plan** — Fixed scope, fixed price, written down. Then we start.
4. **The build** — On your real data, in your real tools. Nothing mocked up.
5. **Your review** — You see it running and shape it with us. Changes land while you watch.
6. **Live** — Launch, training, handoff. We keep it running from there.

Readable to a business owner. Even. A little motion. Professional. Sits under Honeycomb and above LiveFeed.

When they ask for options: three graphic languages on that timeline, shown in Lavish first. Wait for a pick. Then implement on the live section. Then browser-verify `#how-it-works` at `127.0.0.1:5173`.

### Lavish (when they ask)

- Artifact: `.lavish/process-directions.html` + `.lavish/graphics.js` + `.lavish/logos/`
- `npx -y lavish-axi <html>` then `npx -y lavish-axi poll <html> [--agent-reply "..."]`
- Playbooks `comparison` + `input` before writing the board
- Design source = this site’s tokens, not DaisyUI
- If poll returns `browser_disconnected`, ask. Do not reopen uninvited.
- Layouts if they want them: Timeline / Spread / Chapters
- Nothing ships until they pick

---

## How we build

- Only change what was asked.
- Do not touch `agency-site-base`.
- CompanyDashboard stays one file. Do not shrink the hero dashboard.
- Do not invent version numbers or commit/push/merge unless asked.
- After UI work, verify in the browser (behavior, not just a screenshot). Hero and HandoffStage are the quality bar.
- Motion: compositor only — `will-change: transform, opacity`. No per-frame `filter: blur()`, no `mix-blend-mode` on animated layers.
- Explain in plain language.

---

## Hosting

Static Vite site (`npm run build` → `dist/`). User has a Hostinger VPS and a Squarespace domain. Build `dist`, SFTP into `/var/www/html`, Squarespace A records `@` and `www` → VPS IP. Do not deploy unless asked.

---

## Do not

- Edit `agency-site-base`
- Split `CompanyDashboard.tsx`
- Touch HeroScene or HandoffStage unless asked
- Change brand or pricing unless asked
- Commit or push unless asked
