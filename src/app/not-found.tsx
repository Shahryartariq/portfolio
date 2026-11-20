import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Everything is on the home page.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <>
      <Header home={false} />
      <main id="main" className="wrap lost">
        <h1 className="section-title">Page not found</h1>
        <p>This page doesn&rsquo;t exist. My projects, experience and contact details are all on the home page.</p>
        <p className="actions">
          {/* A plain link: the home page is one document, so a full load is fine and works without JavaScript. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="btn btn-primary" href="/">
            Go to the home page
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="btn" href="/#contact">
            Contact me
          </a>
        </p>
      </main>
    </>
  );
}
