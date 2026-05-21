# Pulse Docs Site

A minimal Next.js 15 app that renders the markdown in [`/docs`](../docs) as a navigable site. Designed to deploy to Vercel with zero further config.

## Local dev

```bash
cd docs-site
npm install
npm run dev
```

Opens at <http://localhost:3000>.

Editing any `.md` file in `/docs` triggers a hot reload.

## Build for production

```bash
npm run build
# outputs static HTML to docs-site/out/
```

`next.config.ts` has `output: 'export'`, so the build produces a fully static site. Vercel can serve `out/` directly with no Node runtime.

## How content is wired

- **Source:** all `.md` files in [`../docs`](../docs), excluding `audits/`, `prototypes/`, and `SCREEN_README_TEMPLATE.md` (those are design assets)
- **Reader:** [`lib/docs.ts`](./lib/docs.ts) walks the docs directory at build time, parses frontmatter (if any), and exposes a typed list of documents
- **Routing:** [`app/[[...slug]]/page.tsx`](./app/%5B%5B...slug%5D%5D/page.tsx) is a catch-all that renders any doc. `README.md` becomes the index (`/`).
- **Navigation:** [`lib/docs.ts`](./lib/docs.ts) `getNavigation()` returns the ordered sidebar groups (Get started + Runbooks) — order is hand-coded there.
- **Rendering:** [`components/Markdown.tsx`](./components/Markdown.tsx) wraps `react-markdown` with `remark-gfm` (tables, task lists), `rehype-highlight` (syntax), and `rehype-autolink-headings` (anchor links).
- **Styling:** Tailwind, with Pulse's brand palette (meadow green `#91A27D`, sand background `#EDE9E4`) in [`tailwind.config.ts`](./tailwind.config.ts) and prose CSS in [`app/globals.css`](./app/globals.css).

## Adding a new doc

1. Drop the `.md` file into `/docs` (or `/docs/runbooks/`)
2. Add its slug to the ordered list in [`lib/docs.ts`](./lib/docs.ts) `getNavigation()` so it appears in the sidebar
3. That's it. The build picks it up next time.

## Deploying to Vercel

1. Import the repo in Vercel
2. **Root Directory:** `docs-site` ← important; must point at this folder, not the repo root or `docs/runbooks`
3. **Framework Preset:** Next.js (auto-detected)
4. **Build command:** `npm run build` (default)
5. **Output directory:** `out` (Next.js export default)
6. Deploy

The build at Vercel will reach up to `../docs` and pull the markdown — both `docs/` and `docs-site/` are in the same repo, so that works automatically.

## Why a separate folder?

`docs-site/` is the **rendering**; `/docs/` is the **content**. Keeping them apart means:

- The markdown in `/docs` stays readable on GitHub with no site-specific frontmatter
- Next.js dependencies stay out of the main app's `package.json`
- You can iterate on the docs UI without touching the main repo's `node_modules`

## Customising the look

- **Colours:** [`tailwind.config.ts`](./tailwind.config.ts) — the `meadow`, `sand`, `ink` palettes
- **Typography:** [`app/layout.tsx`](./app/layout.tsx) — Quicksand for headings, Manrope for body, JetBrains Mono for code
- **Prose styles:** [`app/globals.css`](./app/globals.css) — the `.prose-pulse` class controls how rendered markdown looks
- **Sidebar / header:** [`components/Sidebar.tsx`](./components/Sidebar.tsx) and [`app/layout.tsx`](./app/layout.tsx)

It's plain Next.js + Tailwind — Claude Code can iterate on it directly.
