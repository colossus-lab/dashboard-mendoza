import { Link } from 'react-router-dom';
import { REPORTS, getPoblacionReports, getSeguridadReports } from '../data/reportRegistry';
import { Photo, PhotoCaption } from '../components/ui/Photo';
import { usePageMeta } from '../hooks/usePageMeta';
import landing from '../data/generated/landing.json';
import type { ReportEntry } from '../types/report';

const MINI_STATS = landing.miniStats as Record<string, string>;

const SCALE = [
  { num: landing.poblacionFmt, label: 'Habitantes', detail: `Censo 2022. Variación desde 2010: +${landing.variacion2010Fmt}.` },
  { num: landing.superficieFmt, label: 'Kilómetros cuadrados', detail: `Densidad provincial: ${landing.densidadFmt} habitantes por km².` },
  { num: String(landing.departamentos), label: 'Departamentos', detail: 'De Capital a Malargüe. Los informes comparan los 18 cuando hay datos.' },
  { num: landing.viviendasFmt, label: 'Viviendas', detail: `${landing.viviendasParticularesFmt} particulares y ${landing.viviendasColectivasFmt} colectivas, con ${landing.hogaresFmt} hogares.` },
];

const PROVINCIA = ['potrerillos', 'vinedos', 'puente-del-inca', 'atuel'];

export function Landing() {
  usePageMeta(
    null,
    `${REPORTS.length} informes con datos abiertos sobre la provincia de Mendoza: población, hábitat, salud, educación, empleo y seguridad.`,
    '/',
  );

  return (
    <div className="landing">
      <header className="hero">
        <Photo imageKey="aconcagua" sizes="100vw" className="hero-photo" priority />
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">Edición MMXXVI · Provincia de Mendoza</p>
          <h1 className="display">Mendoza, <em>en datos.</em></h1>
          <p className="hero-lede">
            {REPORTS.length} informes sobre quién vive en la provincia, cómo vive y en qué condiciones, con datos abiertos del Censo 2022 y del Sistema Nacional de Información Criminal.
          </p>
          <p className="hero-attribution">
            <a href="https://www.openarg.org" target="_blank" rel="noopener noreferrer">OpenArg</a>
            {' '}por{' '}
            <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer">Colossus Lab</a>
          </p>
        </div>
      </header>
      <div className="container"><PhotoCaption imageKey="aconcagua" /></div>

      <section className="section container" aria-labelledby="escala">
        <SectionHeader id="escala" number="I" title="La escala" />
        <div className="scale">
          {SCALE.map(row => (
            <div key={row.label} className="scale-row">
              <span className="scale-num">{row.num}</span>
              <span className="scale-label">{row.label}</span>
              <span className="scale-detail">{row.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="poblacion" className="section container" aria-labelledby="poblacion-titulo">
        <SectionHeader
          id="poblacion-titulo"
          number="II"
          title="Quiénes somos"
          lede="La foto del Censo 2022 de la provincia y sus 18 departamentos."
        />
        <div className="report-grid">
          {getPoblacionReports().map(report => <ReportCard key={report.id} report={report} />)}
        </div>
      </section>

      <section id="seguridad" className="section container" aria-labelledby="seguridad-titulo">
        <SectionHeader
          id="seguridad-titulo"
          number="III"
          title="Seguridad"
          lede="Hechos delictivos registrados en la provincia y sus departamentos, y muertes viales."
        />
        <div className="report-grid">
          {getSeguridadReports().map(report => <ReportCard key={report.id} report={report} />)}
        </div>
      </section>

      <section className="section container" aria-labelledby="provincia">
        <SectionHeader id="provincia" number="IV" title="La provincia" lede="Los números hablan de un territorio concreto." />
        <div className="province-grid">
          {PROVINCIA.map(key => (
            <figure key={key} className="province-photo">
              <Photo imageKey={key} sizes="(min-width: 900px) 25vw, 50vw" />
              <figcaption><PhotoCaption imageKey={key} /></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ id, number, title, lede }: { id: string; number: string; title: string; lede?: string }) {
  return (
    <header className="section-header">
      <p className="eyebrow">Sección {number}</p>
      <h2 id={id} className="section-title">{title}</h2>
      {lede && <p className="section-lede">{lede}</p>}
    </header>
  );
}

function ReportCard({ report }: { report: ReportEntry }) {
  return (
    <Link to={`/${report.slug}`} className="report-card">
      <Photo imageKey={report.image} sizes="(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw" className="report-card-photo" />
      <span className="report-card-num">{String(report.order).padStart(2, '0')}</span>
      <span className="report-card-title">{report.title}</span>
      <span className="report-card-desc">{report.description}</span>
      <span className="report-card-foot">
        <span className="report-card-stat">{MINI_STATS[report.id]}</span>
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
