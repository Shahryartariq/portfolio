/**
 * The career chain, oldest first. Each entry becomes a block that is mined
 * (proof of work, see src/lib/chain.ts) when the site is built, so every
 * hash and "prev" link on the page is real and can be checked.
 *
 * To add a role: append an entry. Never edit an old entry without expecting
 * every later hash to change — that is the point.
 */
export type Tx = {
  title: string;
  detail?: string;
  /** Public link, only when the work is public. */
  href?: string;
};

export type BlockData = {
  id: string;
  kind: "job" | "study" | "freelance" | "build";
  title: string;
  org: string;
  start: string; // YYYY-MM
  end: string | null; // YYYY-MM, null = present
  place: string;
  summary: string;
  txs: Tx[];
  /** Shown as unconfirmed until the details are filled in. */
  pending?: boolean;
};

export const chainData: BlockData[] = [
  {
    id: "sargodha",
    kind: "study",
    title: "BS in Software Engineering",
    org: "University of Sargodha",
    start: "2018-09",
    end: "2022-06",
    place: "Sargodha",
    summary: "Where it started. Graduated with a silver medal.",
    txs: [
      {
        title: "E-voting on a blockchain",
        detail: "Final-year project: public and private elections with votes recorded on chain.",
      },
    ],
  },
  {
    id: "freelance",
    kind: "freelance",
    title: "Freelance web developer",
    org: "Fiverr and Upwork",
    start: "2020-04",
    end: null,
    place: "Remote",
    summary: "More than 100 client projects, start to finish.",
    txs: [
      { title: "Level 2 Seller on Fiverr", detail: "Earned through 100+ completed orders." },
      { title: "Rising Talent on Upwork", detail: "Web development for clients abroad." },
    ],
  },
  {
    id: "fast",
    kind: "study",
    title: "MS in Cyber Security",
    org: "FAST NUCES",
    start: "2022-07",
    end: "2024-08",
    place: "Islamabad",
    summary: "Graduated with a gold medal.",
    txs: [
      {
        title: "Thesis: smart contract for secure federated learning",
      },
      { title: "Director Projects, FAST Blockchain Society" },
      { title: "Member, FAST Cyber Security Society" },
    ],
  },
  {
    id: "ameeqcode",
    kind: "job",
    title: "Full Stack Developer",
    org: "AmeeqCode",
    start: "2023-06",
    end: "2025-02",
    place: "Islamabad",
    summary: "Client software for legal, trade-finance and healthcare teams.",
    txs: [
      {
        title: "Shariyah Review Bureau platform",
        detail:
          "Secure legal workflows in Vue and Rust (Actix) with Microsoft Graph and MongoDB: document generation, digital signatures, fine-grained access control and PII protection. Deployed with Jenkins, Docker and Podman on DigitalOcean.",
        href: "https://shariyah.net/",
      },
      {
        title: "LC Management",
        detail:
          "Letters of credit for a trade-finance team in Rust (Actix), PostgreSQL and plain HTML/CSS. Tracks issuing bank, currency and terms, and prints the trade documents as PDFs: airway bills, bills of lading, beneficiary certificates and more.",
      },
      {
        title: "ICSI clinic website",
        detail: "Public site for a fertility clinic in Islamabad and Multan.",
        href: "https://icsi.com.pk/",
      },
    ],
  },
  {
    id: "plutus",
    kind: "job",
    title: "Blockchain Developer",
    org: "Plutus",
    start: "2024-12",
    end: "2025-04",
    place: "Lahore, remote",
    summary: "React frontends for Substrate-based networks.",
    txs: [
      {
        title: "Web3 frontend for a Substrate chain",
        detail: "React components wired to Rust Substrate modules, talking to nodes over gRPC.",
      },
    ],
  },
  {
    id: "devsinc",
    kind: "job",
    title: "Software Engineer I",
    org: "Devsinc",
    start: "2025-02",
    end: "2025-09",
    place: "Islamabad",
    summary: "Bitcoin products and the monorepo behind them.",
    txs: [
      {
        title: "Bitcoin NFT inscription platform",
        detail: "Led full-stack work in Next.js, Node.js, Firebase and Supabase: auth, multi-wallet connect, secure APIs and CI/CD.",
      },
      {
        title: "Bitcoin collectibles and rewards marketplace",
        detail: "Fixed critical backend and integration bugs, wrote wallet hooks and backend tests.",
      },
      {
        title: "Next.js multi-zone monorepo",
        detail: "Turborepo setup that let several teams ship parts of one product independently.",
      },
    ],
  },
  {
    id: "builds",
    kind: "build",
    title: "Seven products, shipped",
    org: "Own work",
    start: "2025-11",
    end: "2026-11",
    place: "github.com/Shahryartariq",
    summary: "Each one live, tested and open source.",
    txs: [
      { title: "Satscope", detail: "Bitcoin wallet checkup with one-click PSBT fixes.", href: "https://satscope.vercel.app" },
      { title: "Authforge", detail: "Production auth starter for Next.js.", href: "https://getauthforge.vercel.app" },
      { title: "Hashwire and Tensorwire", detail: "Crypto and AI news, grouped by network and lab.", href: "https://tensorwire.vercel.app" },
      { title: "Playpace, Skycast, TidyText", detail: "Small tools people use every day.", href: "https://getplaypace.vercel.app" },
    ],
  },
  {
    id: "visiontech",
    kind: "job",
    title: "Full Stack Developer",
    org: "VisionTech",
    start: "2026-02",
    end: null,
    place: "Islamabad",
    summary: "Building and shipping full-stack web products.",
    txs: [],
  },
];
