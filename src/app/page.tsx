import { CommandPalette, type PaletteItem } from "@/components/CommandPalette";
import { CopyEmail } from "@/components/CopyEmail";
import { Hash } from "@/components/Hash";
import { Header, SECTIONS } from "@/components/Header";
import { MiningHash } from "@/components/MiningHash";
import { BlockExplorer } from "@/components/BlockExplorer";
import { HashName } from "@/components/HashName";
import { MineMessage } from "@/components/MineMessage";
import { clients } from "@/data/clients";
import { projects, type Project } from "@/data/projects";
import { about, profile } from "@/data/profile";
import { getChain } from "@/lib/chain";
import { getStatuses, type SiteStatus } from "@/lib/status";

export const revalidate = 300;

const REPO = "https://github.com/Shahryartariq/portfolio";

function utcTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

function StatusBadge({ status }: { status?: SiteStatus }) {
  if (!status) return null;
  const text =
    status.state === "down"
      ? "Not responding"
      : `${status.state === "slow" ? "Slow" : "Up"}, ${status.ms} ms`;
  return (
    <span className="status" data-testid={`status-${status.slug}`}>
      <span className="dot" data-state={status.state} aria-hidden="true" />
      {text}
    </span>
  );
}

function ProjectLinks({ p }: { p: Project }) {
  return (
    <p className="links">
      <a href={p.url} target="_blank" rel="noopener">
        Open {p.name}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <a href={p.repo} target="_blank" rel="noopener">
        Source
        <span className="sr-only"> for {p.name} (opens in a new tab)</span>
      </a>
    </p>
  );
}

export default async function Home() {
  const [{ blocks, pending }, statuses] = await Promise.all([getChain(), getStatuses()]);
  const tip = blocks[blocks.length - 1];
  const statusList = Object.values(statuses);
  const up = statusList.filter((s) => s.state !== "down").length;
  const checkedAt = statusList[0]?.checkedAt;
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  const palette: PaletteItem[] = [
    ...SECTIONS.map((s) => ({ id: `s-${s.id}`, label: s.label, hint: "Section", action: `#${s.id}` })),
    ...projects.map((p) => ({
      id: `p-${p.slug}`,
      label: p.name,
      hint: "Open live site",
      action: p.url,
      keywords: `${p.stack.join(" ")} project`,
    })),
    ...projects.map((p) => ({
      id: `r-${p.slug}`,
      label: `${p.name} source`,
      hint: "GitHub",
      action: p.repo,
      keywords: "code repo",
    })),
    ...clients
      .filter((c) => c.href)
      .map((c) => ({ id: `c-${c.slug}`, label: c.name, hint: "Client site", action: c.href!, keywords: "client work" })),
    { id: "copy-email", label: "Copy email address", hint: profile.email, action: `copy:${profile.email}`, keywords: "contact mail" },
    { id: "github", label: "GitHub profile", hint: "github.com/Shahryartariq", action: profile.links.github },
    { id: "linkedin", label: "LinkedIn", hint: "Profile", action: profile.links.linkedin },
    { id: "x", label: "X (Twitter)", hint: "@M_Shehryartariq", action: profile.links.x },
    { id: "source", label: "Source of this site", hint: "GitHub", action: REPO, keywords: "code portfolio" },
    { id: "t-light", label: "Light theme", hint: "Theme", action: "theme:light" },
    { id: "t-dark", label: "Dark theme", hint: "Theme", action: "theme:dark" },
    { id: "t-system", label: "Match my device", hint: "Theme", action: "theme:system", keywords: "system auto" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    url: profile.siteUrl,
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Islamabad", addressCountry: "PK" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "National University of Computer and Emerging Sciences" },
      { "@type": "CollegeOrUniversity", name: "University of Sargodha" },
    ],
    knowsAbout: ["TypeScript", "Rust", "Next.js", "Bitcoin", "Web3", "Application security"],
    sameAs: [profile.links.github, profile.links.linkedin, profile.links.x],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main id="main">
        <section className="hero wrap" id="top" aria-labelledby="name">
          <HashName name={profile.name} />
          <div className="hero-grid">
            <div>
              <p className="hero-role">Full-stack engineer in Islamabad, working in TypeScript and Rust.</p>
              <p className="hero-lede">{profile.lede}</p>
              <p className="actions">
                <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                  Email me
                </a>
                <a className="btn" href={profile.links.github} target="_blank" rel="noopener me">
                  GitHub
                </a>
                <a className="btn" href={profile.links.linkedin} target="_blank" rel="noopener me">
                  LinkedIn
                </a>
              </p>
            </div>
            <aside className="tip" aria-label="Latest state of the career chain">
              <p className="tip-head">
                <span>Chain tip</span>
                <span>Mined when this site was built</span>
              </p>
              <dl>
                <dt>Height</dt>
                <dd>
                  {tip.height} <span className="dim">({blocks.length} blocks)</span>
                </dd>
                <dt>Latest</dt>
                <dd>
                  {tip.org}, {tip.title}
                </dd>
                <dt>Hash</dt>
                <dd data-testid="tip-hash">
                  <MiningHash value={tip.hash} />
                </dd>
                <dt>Live</dt>
                <dd>
                  <span className="status">
                    <span className="dot" data-state={up === projects.length ? "up" : "slow"} aria-hidden="true" />
                    {up} of {projects.length} projects up
                  </span>
                </dd>
                {pending.length > 0 && (
                  <>
                    <dt>Pending</dt>
                    <dd>{pending.length === 1 ? "1 block waiting" : `${pending.length} blocks waiting`}</dd>
                  </>
                )}
              </dl>
              <p className="tip-foot links">
                <a href="#chain">See every block</a>
              </p>
            </aside>
          </div>
        </section>

        <section className="section" id="chain" aria-labelledby="chain-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="section-title" id="chain-title">
                Career, block by block
              </h2>
              <p className="section-note">
                Each step of my career is a block, mined with real proof of work when this site is built. Every hash
                starts with four zeros and includes the hash of the block before it, so editing an old entry would break
                every block after it. Check it yourself.
              </p>
            </div>
            <BlockExplorer blocks={blocks} pending={pending} />
          </div>
        </section>

        <section className="section" id="projects" aria-labelledby="projects-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="section-title" id="projects-title">
                Shipped and running
              </h2>
              <div>
                <p className="section-note">
                  Seven products I designed, built and deployed myself. Each has tests, CI and a public repo. The status
                  next to each one is checked by this site&rsquo;s server every five minutes.
                </p>
                {checkedAt && (
                  <p className="status-line">
                    <span className="status">
                      <span className="dot" data-state={up === projects.length ? "up" : "slow"} aria-hidden="true" />
                      {up} of {projects.length} up
                    </span>
                    <span>Last checked {utcTime(checkedAt)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="featured">
              {featured.map((p) => (
                <article className="feature" key={p.slug} aria-labelledby={`p-${p.slug}`}>
                  <StatusBadge status={statuses[p.slug]} />
                  <h3 className="feature-name" id={`p-${p.slug}`}>
                    {p.name}
                  </h3>
                  <p className="feature-pitch">{p.pitch}</p>
                  <p className="feature-detail">{p.detail}</p>
                  <div className="feature-foot">
                    <ProjectLinks p={p} />
                    <ul className="stack" aria-label="Built with">
                      {p.stack.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>

            <div className="more">
              {rest.map((p) => (
                <article className="row" key={p.slug} aria-labelledby={`p-${p.slug}`}>
                  <h3 className="row-name" id={`p-${p.slug}`}>
                    {p.name}
                  </h3>
                  <StatusBadge status={statuses[p.slug]} />
                  <p className="row-pitch">{p.pitch}</p>
                  <ProjectLinks p={p} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="clients" aria-labelledby="clients-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="section-title" id="clients-title">
                Work for clients
              </h2>
              <p className="section-note">
                Built at AmeeqCode. The code belongs to the clients, so there are no repos to show, but I&rsquo;m happy
                to walk through how they work.
              </p>
            </div>
            <div className="clients">
              {clients.map((c) => (
                <article className="client" key={c.slug} aria-labelledby={`c-${c.slug}`}>
                  <h3 className="client-name" id={`c-${c.slug}`}>
                    {c.name}
                  </h3>
                  <p className="client-meta">{c.stack.join(", ")}</p>
                  <p>{c.text}</p>
                  {c.href ? (
                    <p className="links">
                      <a href={c.href} target="_blank" rel="noopener">
                        Visit {new URL(c.href).hostname}
                      </a>
                    </p>
                  ) : (
                    <span className="private">Internal tool, no public demo</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="about" aria-labelledby="about-title">
          <div className="wrap">
            <div className="section-head">
              <h2 className="section-title" id="about-title">
                About
              </h2>
            </div>
            <div className="about">
              <div className="about-text">
                {about.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <div className="facts">
                <div>
                  <h3>Education</h3>
                  <ul className="edu">
                    {about.education.map((e) => (
                      <li key={e.degree}>
                        <p className="edu-degree">{e.degree}</p>
                        <p className="edu-meta">
                          {e.school}, {e.years}
                        </p>
                        <p className="edu-note">{e.note}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>What I work with</h3>
                  <dl className="skills">
                    {about.stack.map((g) => (
                      <div key={g.group} style={{ display: "contents" }}>
                        <dt>{g.group}</dt>
                        <dd>{g.items.join(", ")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3>Certifications</h3>
                  <ul className="plain">
                    {about.certifications.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-title">
          <div className="wrap">
            <h2 className="section-title" id="contact-title">
              Get in touch
            </h2>
            <a className="contact-mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <p className="actions">
              <CopyEmail email={profile.email} />
              <a className="btn" href={profile.links.github} target="_blank" rel="noopener me">
                GitHub
              </a>
              <a className="btn" href={profile.links.linkedin} target="_blank" rel="noopener me">
                LinkedIn
              </a>
              <a className="btn" href={profile.links.x} target="_blank" rel="noopener me">
                X
              </a>
            </p>
            <MineMessage to={profile.email} prev={tip.hash} height={tip.height + 1} />
          </div>
        </section>
      </main>
      <footer className="foot">
        <div className="wrap">
          <p>
            © {new Date().getUTCFullYear()} {profile.name}
          </p>
          <p>
            Built with Next.js.{" "}
            <a href={REPO} target="_blank" rel="noopener">
              Source on GitHub
            </a>
          </p>
          <p>
            Tip at height {tip.height}: <Hash value={tip.hash} head={10} tail={4} />
          </p>
        </div>
      </footer>
      <CommandPalette items={palette} />
    </>
  );
}
