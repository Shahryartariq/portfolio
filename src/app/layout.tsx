import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { profile } from "@/data/profile";
import "./globals.css";

const mona = localFont({
  src: "../fonts/MonaSans.woff2",
  variable: "--font-mona",
  weight: "200 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

const title = `${profile.name}: full-stack engineer`;
const description =
  "Full-stack engineer in Islamabad building with TypeScript and Rust: Bitcoin wallet tools, auth systems and secure document workflows. Seven live projects, all open source.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: title, template: `%s | ${profile.name}` },
  description,
  alternates: { canonical: "/" },
  authors: [{ name: profile.name, url: profile.siteUrl }],
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title,
    description,
    firstName: "Muhammad Shehryar",
    lastName: "Tariq",
  },
  twitter: { card: "summary_large_image", title, description, creator: "@M_Shehryartariq" },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1a2f" },
    { media: "(prefers-color-scheme: light)", color: "#edf1f6" },
  ],
  colorScheme: "dark light",
};

// Applies the saved theme before first paint, so there is no flash.
const themeScript = `try{var t=localStorage.getItem("portfolio:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mona.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
