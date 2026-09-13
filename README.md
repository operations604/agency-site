# Applied Systems — marketing site

Single-page marketing site for a custom software and automation agency.
Built with Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, and
Lucide icons.

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

## Make it yours

- **Calendly**: set `CALENDLY_URL` in `src/lib/calendly.ts` to your real
  Calendly link. Both the popup buttons and the inline booking embed use it.
- **Brand name / logo**: `src/components/nav/Logo.tsx` and the favicon in
  `public/favicon.svg`.
- **Contact email**: `src/components/sections/Footer.tsx`.
- **Copy**: each section owns its text. Sections live in
  `src/components/sections/`, the hero in `src/components/hero/`,
  the dashboard demo in `src/components/dashboard/`, and the product
  previews in `src/components/previews/`.
- **Theme**: colors, fonts, and shared classes are all in `src/index.css`.

## Deploy

`npm run build` outputs a static site to `dist/`. Drop it on any static host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages). No server needed.
