import { profile } from "@/data/profile";
import { SearchButton } from "./SearchButton";
import { ThemeToggle } from "./ThemeToggle";

export const SECTIONS = [
  { id: "chain", label: "Career" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Client work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <a className="mark" href="#top" aria-label={`${profile.name}, back to top`}>
          {profile.initials}
        </a>
        <nav className="nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="top-actions">
          <SearchButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
