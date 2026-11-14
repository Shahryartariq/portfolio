import { profile } from "@/data/profile";
import { SearchButton } from "./SearchButton";
import { ThemeToggle } from "./ThemeToggle";

/** In the same order as the sections on the page. */
export const SECTIONS = [
  { id: "fullstack", label: "What I do" },
  { id: "skyline", label: "Activity", keywords: "github skyline 3d contributions commits city" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Client work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const satisfies readonly { id: string; label: string; keywords?: string }[];

/**
 * `home` is false on pages other than the home page (the 404): section links
 * then point back to the home page, and the search button is left out because
 * the command palette only exists there.
 */
export function Header({ home = true }: { home?: boolean }) {
  const base = home ? "" : "/";
  return (
    <header className="top">
      <div className="wrap">
        <a className="mark" href={home ? "#top" : "/"}>
          {profile.initials}
          <span className="sr-only">
            , {profile.name}, {home ? "back to top" : "home page"}
          </span>
        </a>
        <nav className="nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`${base}#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="top-actions">
          {home && <SearchButton />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
