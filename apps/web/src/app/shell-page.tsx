import Link from "next/link";

import { routeShells, sharedWebFoundation, type RouteShell } from "./route-shells";

type ShellPageProps = {
  readonly shell: RouteShell;
};

export function ShellPage({ shell }: ShellPageProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand-link" href="/">
          <span className="brand-mark">N</span>
          {sharedWebFoundation.appName}
        </Link>
        <nav aria-label="Primary navigation" className="site-nav">
          {routeShells.map((item) => (
            <Link
              aria-current={item.id === shell.id ? "page" : undefined}
              className={item.id === shell.id ? "nav-link nav-link-active" : "nav-link"}
              href={item.path}
              key={item.id}
            >
              {item.navLabel}
            </Link>
          ))}
        </nav>
      </header>

      <main className="page-main">
        <section aria-labelledby={`${shell.id}-title`} className="shell-panel">
          <p className="shell-label">{shell.label}</p>
          <h1 className="shell-title" id={`${shell.id}-title`}>
            {shell.title}
          </h1>
          <p className="shell-summary">{shell.summary}</p>

          <div className="shell-card">
            <div>
              <p className="shell-card-title">{shell.cardTitle}</p>
              <p className="shell-card-text">{shell.cardText}</p>
            </div>
            <dl className="proof-list">
              <div>
                <dt>Locales</dt>
                <dd>{sharedWebFoundation.localeCount}</dd>
              </div>
              <div>
                <dt>Starter technique</dt>
                <dd>{sharedWebFoundation.proofTechniqueName}</dd>
              </div>
              <div>
                <dt>Install ID check</dt>
                <dd>{sharedWebFoundation.acceptsLocalInstallId ? "Ready" : "Unavailable"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
