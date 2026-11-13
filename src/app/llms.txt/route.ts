import { experience } from "@/data/experience";
import { clients } from "@/data/clients";
import { projects } from "@/data/projects";
import { about, profile } from "@/data/profile";
import { span } from "@/lib/dates";

export const dynamic = "force-static";

/** A plain-text summary for AI assistants and crawlers (llmstxt.org). */
export function GET() {
  const lines = [
    `# ${profile.name}`,
    "",
    `> ${profile.role} in ${profile.location}. ${profile.lede}`,
    "",
    "## Contact",
    `- Email: ${profile.email}`,
    `- GitHub: ${profile.links.github}`,
    `- LinkedIn: ${profile.links.linkedin}`,
    "",
    "## Experience",
    ...[...experience]
      .reverse()
      .map((d) => `- ${d.org}, ${d.title} (${span(d.start, d.end)}): ${d.summary}`),
    "",
    "## Live projects",
    ...projects.map((p) => `- [${p.name}](${p.url}): ${p.pitch} Source: ${p.repo}`),
    "",
    "## Client work",
    ...clients.map((c) => `- ${c.name} (${c.stack.join(", ")}): ${c.text}`),
    "",
    "## Education",
    ...about.education.map((e) => `- ${e.degree}, ${e.school}, ${e.years}. ${e.note}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
