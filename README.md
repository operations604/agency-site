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

`npm run build` also writes precompressed Brotli and gzip variants for text
assets. `server/index.mjs` serves those variants with immutable caching for
hashed build files.

Lossless WebP files used by the site live under `public/logos/`,
`public/timeline/`, and `public/robots/`. Their original PNG source files are
kept outside the deployed public directory under `source-assets/`.

## Make it yours

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
