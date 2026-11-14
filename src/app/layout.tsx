import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/components/Analytics";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import "./globals.css";

const mona = localFont({
  src: "../fonts/MonaSans.woff2",
  variable: "--font-mona",
  weight: "200 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

// Geist Mono cut down to the Latin characters the site uses: 13 KB instead of 71 KB.
// Rebuild it with pyftsubset from the full font if a new character is ever needed.
const geistMono = localFont({
  src: "../fonts/GeistMono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
});

const title = `${profile.name} | Full-Stack Engineer in Islamabad`;
const description = `${profile.name} is a full-stack engineer in Islamabad working across AI, blockchain and security in TypeScript, Next.js and Rust. ${projects.length} live projects.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: title, template: `%s | ${profile.name}` },
  description,
  alternates: { canonical: "/" },
  applicationName: profile.name,
  authors: [{ name: profile.name, url: profile.siteUrl }],
  creator: profile.name,
  keywords: [
    "Muhammad Shehryar Tariq",
    "Shehryar Tariq",
    "Shahryar Tariq",
    "full-stack engineer",
    "full-stack developer Islamabad",
    "Next.js developer",
    "TypeScript",
    "Rust developer",
    "Web3 developer",
    "Bitcoin developer",
    "AI developer",
    "cyber security",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title,
    description,
    locale: "en_US",
    firstName: "Muhammad Shehryar",
    lastName: "Tariq",
    username: "Shahryartariq",
  },
  twitter: { card: "summary_large_image", title, description, site: "@M_Shehryartariq", creator: "@M_Shehryartariq" },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1a2f" },
    { media: "(prefers-color-scheme: light)", color: "#edf1f6" },
  ],
  colorScheme: "dark light",
};

// Without JavaScript: show every experience entry (the tabs can't switch) and hide
// the controls that need scripts, so nothing on the page is a dead end.
const noScriptCss =
  ".panel[hidden]{display:block!important}.panel+.panel{margin-top:1rem}" +
  ".miner,.search-btn,.icon-btn,.js-only,.integrity,.skyline-bar .btn{display:none!important}";

// Applies the saved theme before first paint, so there is no flash.
const themeScript = `try{var t=localStorage.getItem("portfolio:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mona.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: noScriptCss }} />
        </noscript>
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
