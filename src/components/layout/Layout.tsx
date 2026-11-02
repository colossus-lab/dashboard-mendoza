import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useStore } from '../../store/useStore';
import { REPORTS, getPoblacionReports, getSeguridadReports } from '../../data/reportRegistry';
import { SiteFooter } from './SiteFooter';

export function Layout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const { pathname } = useLocation();
  const isReport = REPORTS.some(r => pathname === `/${r.slug}`);

  return (
    <div className="page">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <div className="flagstripe" aria-hidden="true" />
      <TopBar />
      {sidebarOpen && <MobileMenu />}

      <div className={isReport ? 'shell shell-report' : 'shell'}>
        {isReport && (
          <aside className="psidebar" aria-label="Navegación de informes">
            <ReportNav />
          </aside>
        )}
        <main id="main-content" className="main">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}

function TopBar() {
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const toggleSidebar = useStore(s => s.toggleSidebar);

  return (
    <header className="topbar">
      <div className="topbar-start">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Menú de informes"
          aria-expanded={sidebarOpen}
          aria-controls="mobile-menu"
          className="icon-button topbar-menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <Link to="/" className="topbar-mark">
          <span className="topbar-mark-name">Mendoza, en datos</span>
          <span className="topbar-mark-sub">OpenArg</span>
        </Link>
        <Breadcrumb />
      </div>
      <div className="topbar-end">
        <a className="topbar-link" href="https://www.openarg.org" target="_blank" rel="noopener noreferrer">openarg.org →</a>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Breadcrumb() {
  const { pathname } = useLocation();
  const report = REPORTS.find(r => pathname === `/${r.slug}`);
  if (!report) return null;

  return (
    <nav className="breadcrumb" aria-label="Ubicación">
      <span aria-hidden="true">/</span>
      <span>{report.category}</span>
      <span aria-hidden="true">/</span>
      <span className="breadcrumb-current">{report.shortTitle}</span>
    </nav>
  );
}

function ReportNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const groups: Array<[string, typeof REPORTS]> = [
    ['Población', getPoblacionReports()],
    ['Seguridad', getSeguridadReports()],
  ];

  return (
    <nav>
      {groups.map(([name, reports]) => (
        <div key={name} className="report-nav-group">
          <h2 className="report-nav-heading">{name}</h2>
          {reports.map(r => {
            const active = pathname === `/${r.slug}`;
            return (
              <Link
                key={r.id}
                to={`/${r.slug}`}
                onClick={onNavigate}
                className={`report-nav-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="report-nav-num">{String(r.order).padStart(2, '0')}</span>
                <span>{r.shortTitle}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function MobileMenu() {
  const setSidebarOpen = useStore(s => s.setSidebarOpen);
  const [close] = useState(() => () => setSidebarOpen(false));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <>
      <div className="menu-backdrop" onClick={close} aria-hidden="true" />
      <aside id="mobile-menu" className="mobile-menu" aria-label="Menú de informes">
        <ReportNav onNavigate={close} />
        <Link to="/creditos" className="text-link" onClick={close}>Créditos y fuentes →</Link>
      </aside>
    </>
  );
}
