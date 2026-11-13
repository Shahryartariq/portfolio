/** Everything the terminal can show. Built on the server from the same data as the page. */
export type TermData = {
  name: string;
  role: string;
  now: string;
  location: string;
  email: string;
  links: { github: string; linkedin: string; x: string };
  about: string[];
  projects: { slug: string; name: string; url: string; repo: string; pitch: string; stack: string[] }[];
  experience: { when: string; org: string; title: string }[];
  education: string[];
  skills: { group: string; items: string[] }[];
  sections: { id: string; label: string }[];
};

export type Action =
  | { type: "open"; url: string }
  | { type: "goto"; id: string }
  | { type: "theme"; theme: "light" | "dark" | "system" }
  | { type: "clear" }
  | { type: "exit" };

export type Result = { lines: string[]; action?: Action };

const COMMANDS: [string, string][] = [
  ["help", "show this list"],
  ["whoami", "who this site is about"],
  ["ls [folder]", "list files"],
  ["cat <file>", "read a file, e.g. cat projects/satscope.md"],
  ["open <name>", "open a project, github or linkedin in a new tab"],
  ["goto <section>", "jump to a section of the page"],
  ["theme <light|dark|system>", "switch the colours"],
  ["sudo hire-me", "start an email to me"],
  ["clear", "clear the screen"],
  ["exit", "close the terminal"],
];

/** The pretend file system: path → lines. */
export function files(d: TermData): Record<string, string[]> {
  const fs: Record<string, string[]> = {
    "about.txt": d.about,
    "contact.txt": [`email     ${d.email}`, `github    ${d.links.github}`, `linkedin  ${d.links.linkedin}`, `x         ${d.links.x}`],
    "experience.txt": d.experience.map((e) => `${e.when.padEnd(22)} ${e.org}, ${e.title}`),
    "education.txt": d.education,
    "skills.txt": d.skills.map((s) => `${s.group.padEnd(10)} ${s.items.join(", ")}`),
  };
  for (const p of d.projects) {
    fs[`projects/${p.slug}.md`] = [`# ${p.name}`, p.pitch, `stack  ${p.stack.join(", ")}`, `live   ${p.url}`, `code   ${p.repo}`];
  }
  return fs;
}

function ls(d: TermData, arg?: string): string[] {
  const names = Object.keys(files(d));
  const folder = (arg ?? "").replace(/\/$/, "");
  if (!folder || folder === "." || folder === "~") {
    return [[...names.filter((n) => !n.includes("/")), "projects/"].join("   ")];
  }
  if (folder === "projects") return [names.filter((n) => n.startsWith("projects/")).map((n) => n.slice(9)).join("   ")];
  return [`ls: ${arg}: no such folder`];
}

export function run(input: string, d: TermData): Result {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [] };
  const [cmd, ...args] = words;
  const arg = args.join(" ");

  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
      return { lines: COMMANDS.map(([c, what]) => `${c.padEnd(28)} ${what}`) };
    case "whoami":
      return { lines: [d.name, `${d.role}, ${d.location}`, d.now] };
    case "pwd":
      return { lines: ["/home/shehryar"] };
    case "date":
      return { lines: [new Date().toString()] };
    case "echo":
      return { lines: [arg] };
    case "ls":
      return { lines: ls(d, args.find((a) => !a.startsWith("-"))) };
    case "cat": {
      if (!arg) return { lines: ["cat: which file? Try: cat about.txt"] };
      const fs = files(d);
      const key = arg.replace(/^\.\//, "");
      const hit = fs[key] ?? fs[`projects/${key}`] ?? fs[`projects/${key}.md`] ?? fs[`${key}.txt`];
      return { lines: hit ?? [`cat: ${arg}: no such file. Try: ls`] };
    }
    case "projects":
      return { lines: d.projects.map((p) => `${p.name.padEnd(12)} ${p.url}`) };
    case "skills":
    case "experience":
    case "education":
    case "about":
    case "contact":
      return { lines: files(d)[`${cmd.toLowerCase()}.txt`] };
    case "open": {
      const key = arg.toLowerCase();
      const p = d.projects.find((x) => x.slug === key || x.name.toLowerCase() === key);
      const url = p?.url ?? (key in d.links ? d.links[key as keyof TermData["links"]] : undefined);
      if (!url) return { lines: [`open: don't know "${arg}". Try: open satscope, open github`] };
      return { lines: [`Opening ${url}`], action: { type: "open", url } };
    }
    case "goto":
    case "cd": {
      const key = arg.toLowerCase().replace(/\/$/, "");
      const s = d.sections.find((x) => x.id === key || x.label.toLowerCase() === key);
      if (!s) return { lines: [`${cmd}: no section "${arg}". Sections: ${d.sections.map((x) => x.id).join(", ")}`] };
      return { lines: [`Going to ${s.label}`], action: { type: "goto", id: s.id } };
    }
    case "theme":
      if (arg === "light" || arg === "dark" || arg === "system") {
        return { lines: [`Theme set to ${arg}`], action: { type: "theme", theme: arg } };
      }
      return { lines: ["theme: use light, dark or system"] };
    case "sudo":
      if (arg === "hire-me" || arg === "hire me") {
        return {
          lines: ["Permission granted. Opening your email app."],
          action: { type: "open", url: `mailto:${d.email}?subject=${encodeURIComponent("Let's talk")}` },
        };
      }
      return { lines: ["Nice try. The only sudo command here is: sudo hire-me"] };
    case "clear":
    case "cls":
      return { lines: [], action: { type: "clear" } };
    case "exit":
    case "quit":
    case "q":
      return { lines: [], action: { type: "exit" } };
    default:
      return { lines: [`${cmd}: command not found. Type help to see what works.`] };
  }
}

/** Tab completion: finishes a command name or a file name when exactly one matches. */
export function complete(input: string, d: TermData): string {
  const lead = input.match(/^\s*/)![0];
  const parts = input.trimStart().split(/\s+/);
  if (parts.length <= 1) {
    const names = COMMANDS.map(([c]) => c.split(" ")[0]).concat(["projects", "skills", "experience", "contact"]);
    const hits = names.filter((n) => n.startsWith(parts[0] ?? ""));
    return hits.length === 1 ? `${lead}${hits[0]} ` : input;
  }
  const last = parts[parts.length - 1];
  const cmd = parts[0].toLowerCase();
  const pool =
    cmd === "cat" || cmd === "ls"
      ? [...Object.keys(files(d)), "projects/"]
      : cmd === "open"
        ? [...d.projects.map((p) => p.slug), "github", "linkedin"]
        : cmd === "goto" || cmd === "cd"
          ? d.sections.map((s) => s.id)
          : cmd === "theme"
            ? ["light", "dark", "system"]
            : [];
  const hits = pool.filter((n) => n.startsWith(last));
  if (hits.length !== 1) return input;
  return `${lead}${[...parts.slice(0, -1), hits[0]].join(" ")}`;
}
