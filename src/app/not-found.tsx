import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="wrap lost">
        <h1 className="section-title">No block at this address</h1>
        <p>This page doesn&rsquo;t exist. The career chain, projects and contact details are all on the home page.</p>
        <p className="actions">
          <Link className="btn btn-primary" href="/">
            Go to the home page
          </Link>
        </p>
      </main>
    </>
  );
}
