import { profile } from "@/data/profile";
import { SearchButton } from "./SearchButton";
import { TerminalButton } from "./Terminal";
import { ThemeToggle } from "./ThemeToggle";

export const SECTIONS = [
  { id: "fullstack", label: "What I do" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "clients", label: "Client work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <a className="mark" href="#top">
          {profile.initials}
          <span className="sr-only">, {profile.name}, back to top</span>
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
          <TerminalButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
