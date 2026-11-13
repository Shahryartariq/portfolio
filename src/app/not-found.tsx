import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="wrap lost">
        <h1 className="section-title">This page doesn&rsquo;t exist</h1>
        <p>My projects, experience and contact details are all on the home page.</p>
        <p className="actions">
          <Link className="btn btn-primary" href="/">
            Go to the home page
          </Link>
        </p>
      </main>
    </>
  );
}
