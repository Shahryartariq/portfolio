# Muhammad Shehryar Tariq: portfolio

**Live: [shehryartariq.vercel.app](https://shehryartariq.vercel.app)**

My portfolio. My career is shown as a small blockchain, and every project I've shipped has a live status check.

## What makes it different

- **A name made of hashes.** The hero draws my name on a canvas, with hex digits cut into the letters that keep re-rolling like a miner. Under the cursor they settle to zeros, as if a proof was found. The real `<h1>` stays in the page for screen readers and search engines.
- **The career chain is real.** Each step of my career is a block that gets mined with proof of work when the site is built. Every hash starts with four zeros and includes the hash of the block before it, so editing an old entry breaks every block after it. The chain is shown as a row of 3D blocks you can step through with the mouse or arrow keys. Visitors can press **Verify the chain** to rehash every block in their own browser with Web Crypto, and watch the links turn green one by one.
- **Contact by mining a block.** The contact form mines the visitor's message as the next block on top of the chain, in a Web Worker, showing the nonce and hash rate as it goes. It then opens their email app with the message and the mined block.
- **Live project status.** The server checks each of my seven live projects every five minutes and shows whether it's up and how fast it answered.
- **Command palette.** Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to jump to any section, project, source repo or link, copy my email, or switch the theme.
- Dark and light themes that follow the device, with no flash on load.
- Responsive down to small phones, keyboard friendly, and checked with axe in both themes.

## Tech

Next.js 16 (App Router, static with 5-minute revalidation) · React 19 · TypeScript (strict) · hand-written CSS · Mona Sans and Geist Mono, both self-hosted · Vitest · Playwright · GitHub Actions.

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
| Career chain (jobs, studies, highlights) | `src/data/chain.ts` |
| Live projects | `src/data/projects.ts` |
| Client work | `src/data/clients.ts` |

To add a role, append it to the end of `src/data/chain.ts`. An entry with `pending: true` is shown above the chain as unconfirmed and isn't mined.

## License

MIT for the code. The written content and personal details are mine.
