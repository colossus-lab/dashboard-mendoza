import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getPoblacionReports, getSectorialReports } from '../data/reportRegistry';
import { SectionReveal } from '../components/ui/SectionReveal';
import type { ReportEntry } from '../types/report';

// ─── Macro KPIs for the hero ───
const HERO_STATS = [
  { value: 2043540, label: 'Habitantes', suffix: '' },
  { value: 149069, label: 'km²', suffix: '' },
  { value: 18, label: 'Departamentos', suffix: '' },
  { value: 9, label: 'Informes', suffix: '' },
];

// ─── Resumen de la provincia (Censo Nacional 2022 INDEC) ───
const RESUMEN = {
  categoria: 'Provincia de Mendoza — 18 departamentos',
  stats: [
    { value: '2.043.540', label: 'Población total Censo 2022', hint: 'Variación 2010–2022: +17,5%' },
    { value: '149.069', label: 'Superficie km²', hint: 'Densidad provincial: 13,7 hab/km²' },
    { value: '18', label: 'Departamentos', hint: 'Capital, Godoy Cruz, Guaymallén, Las Heras, Maipú, Luján, San Rafael y otros' },
    { value: '702.009', label: 'Total de viviendas', hint: '701.357 particulares · 652 colectivas' },
  ],
};

// ─── Mini-stats per report (contextual data for cards) ───
const MINI_STATS: Record<string, string> = {
  'poblacion-estructura': '2,04M hab · +17,5%',
  'poblacion-habitacional-personas': 'Cobertura agua/cloaca',
  'poblacion-salud-prevision': 'Salud + jubilaciones',
  'poblacion-hogares': '~720K hogares',
  'poblacion-viviendas': 'Stock habitacional',
  'poblacion-educacion': 'Nivel educativo alcanzado',
  'poblacion-actividad-economica': 'Empleo y actividad',
  'poblacion-fecundidad': 'Hijos por mujer',
  'seguridad-snic': 'SNIC Mendoza vs país',
};

export function Landing() {
  const poblacion = getPoblacionReports();
  const sectoriales = getSectorialReports();

  return (
    <div className="landing-page">
      <SectionReveal>
        <header className="landing-hero">
          <div className="hero-particles" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="hero-particle" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>

          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Datos abiertos · Mendoza
            </div>
            <h1 className="hero-title">
              Mendoza en números
            </h1>
            <p className="hero-subtitle">
              Hecho desde{' '}
              <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer" className="hero-link">
                Colossus Lab
              </a>{' '}
              con datos abiertos vía{' '}
              <a href="https://www.openarg.org" target="_blank" rel="noopener noreferrer" className="hero-link hero-highlight">
                OpenArg
              </a>{' '}
              🇦🇷
            </p>

            <div className="hero-stats">
              {HERO_STATS.map((stat, i) => (
                <div key={stat.label}>
                  {i > 0 && <span className="hero-stat-divider" />}
                  <div className="hero-stat">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                    <span className="hero-stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>
      </SectionReveal>

      <SectionReveal>
        <section className="resumen-card" aria-labelledby="resumen-titulo">
          <div className="resumen-card-header">
            <span className="resumen-card-eyebrow">Resumen de la provincia</span>
            <h2 id="resumen-titulo" className="resumen-card-title">
              {RESUMEN.categoria}
            </h2>
            <p className="resumen-card-source">
              Censo Nacional 2022 (INDEC) — cuadros provinciales para Mendoza (sufijo _13).
            </p>
          </div>
          <div className="resumen-card-grid">
            {RESUMEN.stats.map(stat => (
              <div key={stat.label} className="resumen-stat">
                <span className="resumen-stat-value">{stat.value}</span>
                <span className="resumen-stat-label">{stat.label}</span>
                {stat.hint && <span className="resumen-stat-hint">{stat.hint}</span>}
              </div>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <div className="categorias-intro">
          <h2 className="categorias-intro-title">Explorá las categorías</h2>
        </div>
      </SectionReveal>

      <SectionReveal>
        <section className="landing-section">
          <div className="section-header">
            <div className="section-number">01</div>
            <div>
              <h2 className="section-title">Quiénes somos en Mendoza</h2>
              <p className="section-desc">Cuántos somos, cómo vivimos, de dónde venimos. La foto del Censo 2022 de la provincia con sus 18 departamentos.</p>
            </div>
          </div>
          <div className="report-grid">
            {poblacion.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="landing-section">
          <div className="section-header">
            <div className="section-number">02</div>
            <div>
              <h2 className="section-title">Seguridad en la provincia</h2>
              <p className="section-desc">SNIC provincial — delitos y víctimas en Mendoza, comparado contra el resto del país.</p>
            </div>
          </div>
          <div className="report-grid">
            {sectoriales.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <footer className="landing-footer">
        <div className="footer-rule" />
        <p>
          <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            ColossusLab.org
          </a>{' '}
          •{' '}
          <a href="https://www.openarg.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            OpenArg.org
          </a>
        </p>
      </footer>
    </div>
  );
}

function ReportCard({ report, index }: { report: ReportEntry; index: number }) {
  const miniStat = MINI_STATS[report.id] || '';

  return (
    <Link
      to={`/${report.slug}`}
      className="report-card"
      style={{
        '--card-color': report.color,
        animationDelay: `${index * 80}ms`,
      } as React.CSSProperties}
    >
      <div className="report-card-glow" aria-hidden="true" />
      <div className="report-card-header">
        <span className="report-card-icon">{report.icon}</span>
        <span className="report-card-arrow">→</span>
      </div>
      <div className="report-card-body">
        <span className="report-card-title">{report.shortTitle}</span>
        <span className="report-card-desc">{report.title}</span>
      </div>
      {miniStat && (
        <div className="report-card-stat">
          <span className="report-card-stat-value">{miniStat}</span>
        </div>
      )}
    </Link>
  );
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) animate(); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  const formatted = value >= 1000000
    ? `${(value / 1000000).toFixed(1).replace('.', ',')}M`
    : value >= 1000
    ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : `${value}`;

  return (
    <span ref={ref} className="hero-stat-value">
      {formatted}{suffix}
    </span>
  );
}
