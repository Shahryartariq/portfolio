export type Project = {
  slug: string;
  name: string;
  url: string;
  repo: string;
  /** One sentence: what it does for the person using it. */
  pitch: string;
  /** What is technically interesting about it. */
  detail: string;
  stack: string[];
  year: number;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "satscope",
    name: "Satscope",
    url: "https://satscope.vercel.app",
    repo: "https://github.com/Shahryartariq/satscope",
    pitch: "A checkup for Bitcoin wallets: finds inscriptions and Runes at risk of being spent by accident, then fixes them in one signed transaction.",
    detail: "Builds PSBTs for Taproot and SegWit wallets, checks the signed result input by input, and proves address ownership with BIP-322.",
    stack: ["Next.js", "TypeScript", "bitcoinjs", "LaserEyes"],
    year: 2026,
    featured: true,
  },
  {
    slug: "authforge",
    name: "Authforge",
    url: "https://getauthforge.vercel.app",
    repo: "https://github.com/Shahryartariq/authforge",
    pitch: "Auth you can drop into a new Next.js app: email and password, Google and GitHub, two-factor, passkeys, roles and an admin panel.",
    detail: "Better Auth with Drizzle or Prisma picked at setup, rate limits stored in Postgres, and 33 browser tests run in CI.",
    stack: ["Next.js", "Better Auth", "PostgreSQL", "Playwright"],
    year: 2026,
    featured: true,
  },
  {
    slug: "hashwire",
    name: "Hashwire",
    url: "https://hashwire.vercel.app",
    repo: "https://github.com/Shahryartariq/hashwire",
    pitch: "Crypto news from 38 sources, sorted by network, with live prices and a clean reader view.",
    detail: "Detects 22 networks in headlines, including the ambiguous ones like Base and NEAR.",
    stack: ["Next.js", "RSS", "CoinGecko"],
    year: 2026,
  },
  {
    slug: "tensorwire",
    name: "Tensorwire",
    url: "https://tensorwire.vercel.app",
    repo: "https://github.com/Shahryartariq/tensorwire",
    pitch: "AI news from labs, press and builders, with repeat stories grouped into one.",
    detail: "Official lab posts are labelled, and full posts open in a reader view when the feed allows it.",
    stack: ["Next.js", "RSS", "Vitest"],
    year: 2026,
  },
  {
    slug: "playpace",
    name: "Playpace",
    url: "https://getplaypace.vercel.app",
    repo: "https://github.com/Shahryartariq/playpace",
    pitch: "How long a YouTube playlist takes at any speed, and the slowest speed that fits the time you have.",
    detail: "Twelve languages including Urdu and Arabic, streaming results for playlists up to 5,000 videos.",
    stack: ["Next.js", "YouTube API", "i18n"],
    year: 2026,
  },
  {
    slug: "skycast",
    name: "Skycast",
    url: "https://getskycast.vercel.app",
    repo: "https://github.com/Shahryartariq/skycast",
    pitch: "Weather and air quality for Pakistani cities, fast on a slow phone.",
    detail: "Server-side API key, city pages for search, Lighthouse 100 on desktop.",
    stack: ["Next.js", "OpenWeather"],
    year: 2026,
  },
  {
    slug: "tidytext",
    name: "TidyText",
    url: "https://tidytext.vercel.app",
    repo: "https://github.com/Shahryartariq/tidytext",
    pitch: "Cleans pasted text: broken PDF line breaks, extra spaces, duplicates. Runs in the browser, nothing uploaded.",
    detail: "Stateless Django with a strict content security policy and no cookies.",
    stack: ["Django", "JavaScript"],
    year: 2026,
  },
];
