import type { ShapeId } from "@/lib/shapes";

export type Area = "fullstack" | "ai" | "blockchain" | "security";

export const AREA_LABEL: Record<Area, string> = {
  fullstack: "Full-stack",
  ai: "AI",
  blockchain: "Blockchain",
  security: "Security",
};

export type Proof = { text: string; href?: string };

export type Discipline = {
  id: Area;
  shape: ShapeId;
  title: string;
  /** One sentence: what I do in this area. */
  line: string;
  proof: Proof[];
  tools: string[];
};

export const disciplines: Discipline[] = [
  {
    id: "fullstack",
    shape: "fullstack",
    title: "Full-stack",
    line: "Products from database to deploy: the API, the interface, the tests and the pipeline that ships them.",
    proof: [
      { text: "Authforge: auth with passkeys, 2FA and an admin panel, 33 browser tests in CI", href: "https://getauthforge.vercel.app" },
      { text: "Playpace: a YouTube playlist calculator in 12 languages", href: "https://getplaypace.vercel.app" },
      { text: "LC Management: trade-finance documents as PDFs, in Rust (Actix) and PostgreSQL" },
      { text: "A Next.js multi-zone monorepo at Devsinc, shared by several teams" },
    ],
    tools: ["TypeScript", "Next.js", "React", "Node.js", "Rust (Actix)", "Django", "PostgreSQL"],
  },
  {
    id: "ai",
    shape: "ai",
    title: "AI",
    line: "Putting models to work in real products, and making sure the output can be trusted.",
    proof: [
      { text: "Tensorwire: AI news from labs, press and builders, with repeat stories grouped", href: "https://tensorwire.vercel.app" },
      { text: "TidyText: grammar fixes and paraphrasing that run in the browser with Transformers.js", href: "https://tidytext.vercel.app" },
      { text: "MS thesis: smart contracts to secure federated learning" },
    ],
    tools: ["Transformers.js", "Federated learning", "Python"],
  },
  {
    id: "blockchain",
    shape: "blockchain",
    title: "Blockchain",
    line: "Wallet tools and dapps on Bitcoin and Substrate, built to be safe to sign.",
    proof: [
      { text: "Satscope: Bitcoin wallet checkup with one-click PSBT fixes and BIP-322 proofs", href: "https://satscope.vercel.app" },
      { text: "Hashwire: crypto news sorted across 22 networks, with live prices", href: "https://hashwire.vercel.app" },
      { text: "A Bitcoin inscription platform and a collectibles marketplace at Devsinc" },
      { text: "Substrate frontends at Plutus, and an e-voting chain as my final-year project" },
    ],
    tools: ["PSBT", "BIP-322", "Ordinals", "Substrate", "Solidity", "ethers.js"],
  },
  {
    id: "security",
    shape: "security",
    title: "Security",
    line: "An MS in Cyber Security with a gold medal, applied to everyday code.",
    proof: [
      { text: "Access control lists and PII protection for the Shariyah Review Bureau platform", href: "https://shariyah.net/" },
      { text: "Authforge: breached-password checks, rate limits and instant session revocation", href: "https://getauthforge.vercel.app" },
      { text: "Strict content security policies and HSTS on every site I ship" },
      { text: "Member of the FAST Cyber Security Society" },
    ],
    tools: ["Access control", "CSP and HSTS", "OAuth 2.0", "Passkeys and 2FA"],
  },
];
