import type { Role } from "@/data/experience";
import { span } from "@/lib/dates";

const KIND: Record<Role["kind"], string> = { job: "Work", study: "Study", freelance: "Freelance" };

/** Experience, newest first. Plain HTML: every job and project is on the page. */
export function Timeline({ roles }: { roles: Role[] }) {
  const sorted = [...roles].sort((a, b) => (a.start < b.start ? 1 : -1));
  return (
    <ol className="timeline">
      {sorted.map((r) => (
        <li key={r.id} className="role" data-kind={r.kind} data-current={r.end === null || undefined}>
          <p className="role-when">
            {span(r.start, r.end)}
            <span className="role-kind">{KIND[r.kind]}</span>
          </p>
          <div className="role-body">
            <h3 className="role-org">{r.org}</h3>
            <p className="role-title">
              {r.title}
              <span className="dim">, {r.place}</span>
            </p>
            {r.txs.length > 0 ? (
              <ul className="role-work">
                {r.txs.map((t) => (
                  <li key={t.title}>
                    <span className="role-work-title">
                      {t.href ? (
                        <a href={t.href} target="_blank" rel="noopener">
                          {t.title}
                        </a>
                      ) : (
                        t.title
                      )}
                    </span>
                    {t.detail && <span className="role-work-detail"> {t.detail}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="role-summary">{r.summary}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
