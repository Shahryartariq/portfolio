import { describe, expect, it } from "vitest";
import { clients } from "@/data/clients";
import { projects } from "@/data/projects";
import { buildGraph, describe as describeNode, type WorkInput } from "@/lib/constellation";
import { complete, files, run, type TermData } from "@/lib/terminal";

const work: WorkInput[] = [
  ...projects.map((p) => ({ id: p.slug, label: p.name, areas: p.areas, stack: p.stack, href: p.url })),
  { id: "lc", label: "LC Management", areas: ["fullstack"], stack: clients[1].stack },
];

describe("work map", () => {
  const g = buildGraph(work);
  const at = (label: string) => g.nodes.findIndex((n) => n.label === label);

  it("has four areas, every project, and each tool once", () => {
    expect(g.nodes.filter((n) => n.kind === "area")).toHaveLength(4);
    expect(g.nodes.filter((n) => n.kind === "work")).toHaveLength(work.length);
    const skills = g.nodes.filter((n) => n.kind === "skill").map((n) => n.label);
    expect(new Set(skills).size).toBe(skills.length);
    expect(skills).toContain("Next.js");
  });

  it("links shared tools to every project that uses them", () => {
    const next = g.nodes[at("Next.js")];
    expect(next.links.map((l) => g.nodes[l].label)).toEqual(
      expect.arrayContaining(["Satscope", "Authforge", "Playpace"]),
    );
    expect(describeNode(g, at("Satscope"))).toBe(
      "Satscope is built with Next.js, TypeScript, bitcoinjs, LaserEyes. Areas: Blockchain, Security, Full-stack.",
    );
  });

  it("is deterministic, finite and keeps points apart", () => {
    const again = buildGraph(work);
    expect(again.nodes.map((n) => [n.x, n.y, n.z])).toEqual(g.nodes.map((n) => [n.x, n.y, n.z]));
    for (let i = 4; i < g.nodes.length; i++) {
      const a = g.nodes[i];
      expect(Number.isFinite(a.x + a.y + a.z)).toBe(true);
      for (let j = i + 1; j < g.nodes.length; j++) {
        const b = g.nodes[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeGreaterThan(0.3);
      }
    }
  });
});

const d: TermData = {
  name: "Muhammad Shehryar Tariq",
  role: "Full-stack engineer",
  now: "Now: Full Stack Developer at VisionTech",
  location: "Islamabad, Pakistan",
  email: "me@example.com",
  links: { github: "https://github.com/Shahryartariq", linkedin: "https://linkedin.com/in/x", x: "https://x.com/y" },
  about: ["About line."],
  projects: projects.map(({ slug, name, url, repo, pitch, stack }) => ({ slug, name, url, repo, pitch, stack })),
  experience: [{ when: "Feb 2026 to now", org: "VisionTech", title: "Full Stack Developer" }],
  education: ["MS in Cyber Security"],
  skills: [{ group: "Languages", items: ["TypeScript", "Rust"] }],
  sections: [{ id: "projects", label: "Projects" }],
};

describe("terminal", () => {
  it("answers the basics", () => {
    expect(run("whoami", d).lines[0]).toBe("Muhammad Shehryar Tariq");
    expect(run("help", d).lines.join("\n")).toContain("sudo hire-me");
    expect(run("ls", d).lines[0]).toContain("about.txt");
    expect(run("ls projects", d).lines[0]).toContain("satscope.md");
    expect(run("cat projects/satscope.md", d).lines[0]).toBe("# Satscope");
    expect(run("cat satscope", d).lines[0]).toBe("# Satscope");
    expect(run("cat nope", d).lines[0]).toMatch(/no such file/);
    expect(run("   ", d).lines).toEqual([]);
    expect(run("rm -rf /", d).lines[0]).toMatch(/command not found/);
  });

  it("returns actions for open, goto, theme, sudo, clear and exit", () => {
    expect(run("open satscope", d).action).toEqual({ type: "open", url: "https://satscope.vercel.app" });
    expect(run("open github", d).action).toEqual({ type: "open", url: d.links.github });
    expect(run("open nothing", d).action).toBeUndefined();
    expect(run("goto projects", d).action).toEqual({ type: "goto", id: "projects" });
    expect(run("theme dark", d).action).toEqual({ type: "theme", theme: "dark" });
    expect(run("theme pink", d).action).toBeUndefined();
    expect(run("sudo hire-me", d).action).toEqual({ type: "open", url: "mailto:me@example.com?subject=Let's%20talk" });
    expect(run("sudo rm", d).action).toBeUndefined();
    expect(run("clear", d).action).toEqual({ type: "clear" });
    expect(run("exit", d).action).toEqual({ type: "exit" });
  });

  it("completes commands and file names", () => {
    expect(complete("who", d)).toBe("whoami ");
    expect(complete("cat ab", d)).toBe("cat about.txt");
    expect(complete("cat projects/sat", d)).toBe("cat projects/satscope.md");
    expect(complete("open sk", d)).toBe("open skycast");
    expect(complete("c", d)).toBe("c"); // cat, clear, contact: ambiguous
    expect(Object.keys(files(d))).toContain("projects/authforge.md");
  });
});
