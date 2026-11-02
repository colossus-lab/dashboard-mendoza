import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { REPORTS } from '../data/reportRegistry';
import { useReportData } from '../hooks/useReportData';
import { usePageMeta } from '../hooks/usePageMeta';
import { parseReport } from '../lib/markdown';
import { toRoman } from '../lib/format';
import { KPICounter } from '../components/ui/KPICounter';
import { Photo, PhotoCaption } from '../components/ui/Photo';
import { ChartFigure } from '../components/charts/ChartRenderer';
import { RankingTable } from '../components/report/RankingTable';
import { CitationBox } from '../components/report/CitationBox';
import type { ReportEntry } from '../types/report';

// Wrap tables in scrollable container for mobile
const mdComponents = {
  table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="table-scroll"><table {...props}>{children}</table></div>
  ),
};

export function ReportView({ report }: { report: ReportEntry }) {
  usePageMeta(report.title, report.description, `/${report.slug}`);
  return <ReportContent key={report.id} report={report} />;
}

function ReportContent({ report }: { report: ReportEntry }) {
  const { markdown, data, loading, error } = useReportData(report.mdPath, report.dataPath);
  const parsed = useMemo(() => parseReport(markdown || ''), [markdown]);

  if (loading) return <div className="state-page" aria-busy="true">Cargando informe…</div>;
  if (error || !data) {
    return (
      <div className="state-page">
        <p className="eyebrow">Error</p>
        <h1 className="section-title">No pudimos cargar este informe.</h1>
        <p>Probá de nuevo en unos minutos.</p>
        <Link to="/" className="text-link">Volver a la portada →</Link>
      </div>
    );
  }

  const currentIndex = REPORTS.findIndex(r => r.id === report.id);
  const prevReport = currentIndex > 0 ? REPORTS[currentIndex - 1] : null;
  const nextReport = currentIndex < REPORTS.length - 1 ? REPORTS[currentIndex + 1] : null;
  const featured = data.mapData?.[0];

  return (
    <article className="report">
      <header className="report-hero">
        <Photo imageKey={report.image} sizes="(min-width: 1100px) 900px, 100vw" className="report-hero-photo" priority />
        <div className="report-hero-veil" aria-hidden="true" />
        <div className="report-hero-content">
          <p className="eyebrow">{report.category} · Informe {String(report.order).padStart(2, '0')}</p>
          <h1 className="report-title">{report.title}</h1>
          {parsed.dek && <p className="report-dek">{parsed.dek}</p>}
          {featured && (
            <p className="report-featured">
              <span className="report-featured-num">{featured.formatted}</span>
              <span className="report-featured-caption">{featured.caption}</span>
            </p>
          )}
        </div>
      </header>
      <PhotoCaption imageKey={report.image} />

      <div className="report-intro">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.intro}</ReactMarkdown>
      </div>

      <div className="kpi-grid">
        {data.kpis.map(kpi => (
          <KPICounter
            key={kpi.id}
            formatted={kpi.formatted}
            label={kpi.label}
            unit={kpi.unit}
            status={kpi.status}
            comparison={kpi.comparison}
          />
        ))}
      </div>
      <p className="report-scope">{data.meta.scope}</p>

      <nav className="toc" aria-label="En este informe">
        <h2 className="toc-title">En este informe</h2>
        <ol>
          {parsed.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>
                <span className="toc-num">{toRoman(s.number ?? i + 1)}</span>
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {parsed.sections.map((section, i) => {
        const charts = data.charts.filter(c => c.sectionId === section.id);
        const rankings = data.rankings.filter(r => r.sectionId === section.id);
        return (
          <section key={section.id} id={section.id} className="report-section">
            <p className="eyebrow">{toRoman(section.number ?? i + 1)}</p>
            <h2 className="report-section-title">{section.heading}</h2>
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {section.content}
              </ReactMarkdown>
            </div>
            {(charts.length > 0 || rankings.length > 0) && (
              <div className="figures">
                {charts.map(chart => <ChartFigure key={chart.id} chart={chart} />)}
                {rankings.map(ranking => <RankingTable key={ranking.id} ranking={ranking} />)}
              </div>
            )}
          </section>
        );
      })}

      <footer className="report-foot">
        <p className="report-source"><span className="eyebrow">Fuente</span> {data.meta.source}</p>
        <CitationBox report={report} data={data} />
        <nav className="report-pager" aria-label="Informes contiguos">
          {prevReport ? (
            <Link to={`/${prevReport.slug}`}>
              <span className="report-pager-label">← Anterior</span>
              {prevReport.shortTitle}
            </Link>
          ) : <span />}
          {nextReport ? (
            <Link to={`/${nextReport.slug}`} className="is-next">
              <span className="report-pager-label">Siguiente →</span>
              {nextReport.shortTitle}
            </Link>
          ) : <span />}
        </nav>
      </footer>
    </article>
  );
}
