# Muhammad Shehryar Tariq: portfolio

**Live: [shehryartariq.vercel.app](https://shehryartariq.vercel.app)**

My portfolio as a full-stack engineer working across AI, blockchain and security, with a 3D object that changes with each area and a live status check for every project I've shipped.

## What makes it different

- **A name made of hashes.** The hero draws my name on a canvas, with hex digits cut into the letters that keep re-rolling. Under the cursor they settle to zeros. The real `<h1>` has the same size and line breaks, so nothing shifts when the canvas takes over.
- **A 3D object for the four areas I work in.** A cloud of points (three.js) morphs as you scroll: a sphere for the intro, then a browser window (full-stack), a neural network (AI), linked blocks (blockchain) and a shield with a keyhole (security). Points scatter away from the cursor, dragging spins it, a click scatters it. It renders in a Web Worker on an OffscreenCanvas.
- **GitHub skyline.** My last year of GitHub contributions as a 3D city: one building per day, height and colour by count. Drag to turn it, hover a building for the day, download it as an STL for 3D printing. Read from my public profile every 6 hours.
- **Work map.** My projects, the tools behind them and the areas they belong to, as a 3D map you can turn. Pick a project to light up everything it's built with. Drawn on a 2D canvas with its own projection and label placement, so it needs no 3D library.
- **Terminal mode.** Press <kbd>`</kbd> (or the terminal button) and the site becomes a command line: `whoami`, `ls`, `cat projects/satscope.md`, `open authforge`, `goto projects`, `theme light`, `sudo hire-me`, with history and Tab completion.
- **Live project status.** The server checks each of my seven live projects every five minutes.
- **Command palette** (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>), dark and light themes with no flash, responsive down to small phones, axe-checked in both themes.

## SEO

- Title, description, canonical, Open Graph and X cards with generated images, robots with `max-image-preview:large`.
- Structured data: `ProfilePage` with a `Person` (alternate spellings of my name, current job, education, profiles), `WebSite`, and the live projects as `SoftwareSourceCode`.
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `/llms.txt` (plain-text summary for AI assistants).
- The hero heading has the same size and line breaks as the canvas, so there's no layout shift (CLS 0).
- Optional: `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `GA_MEASUREMENT_ID` (see `.env.example`).

## Tech

Next.js 16 (App Router, static with 5-minute revalidation) · React 19 · TypeScript (strict) · three.js · hand-written CSS · Mona Sans and Geist Mono, both self-hosted · Vitest · Playwright · GitHub Actions.

## Run it locally

```bash
npm install
npm run dev            # http://localhost:3000
```

The live sites can't always be reached from a laptop or CI, so set `STATUS_SAMPLE_DATA=1` to use sample status data. See `.env.example` for all settings.

```bash
npm run lint && npm run typecheck && npm test
STATUS_SAMPLE_DATA=1 npm run build && npm run test:e2e
```

## Editing content

| What | Where |
| --- | --- |
| Name, intro, links, about, education, skills | `src/data/profile.ts` |
| Experience (jobs, studies, freelance) | `src/data/experience.ts` |
| The four areas (text, proof points, tools) | `src/data/disciplines.ts` |
| Live projects | `src/data/projects.ts` |
| Client work | `src/data/clients.ts` |

To add a role, append it to the end of `src/data/experience.ts`.

## License

MIT for the code. The written content and personal details are mine.
