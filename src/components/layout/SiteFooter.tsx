import { Link } from 'react-router-dom';
import { getPoblacionReports, getSeguridadReports } from '../../data/reportRegistry';

export function SiteFooter() {
  return (
    <footer className="colophon">
      <div className="colophon-grid">
        <div>
          <p className="colophon-mark">Mendoza, en datos</p>
          <p>Datos abiertos de la provincia, hechos por Colossus Lab vía OpenArg.</p>
        </div>
        <div>
          <h2 className="colophon-heading">Población</h2>
          {getPoblacionReports().map(r => <Link key={r.id} to={`/${r.slug}`}>{r.shortTitle}</Link>)}
        </div>
        <div>
          <h2 className="colophon-heading">Seguridad</h2>
          {getSeguridadReports().map(r => <Link key={r.id} to={`/${r.slug}`}>{r.shortTitle}</Link>)}
        </div>
        <div>
          <h2 className="colophon-heading">Proyecto</h2>
          <Link to="/creditos">Créditos y fuentes</Link>
          <a href="https://www.openarg.org" target="_blank" rel="noopener noreferrer">OpenArg</a>
          <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer">Colossus Lab</a>
          <a href="https://github.com/colossus-lab/dashboard-mendoza" target="_blank" rel="noopener noreferrer">Código</a>
          <a href="mailto:devops@colossuslab.org">devops@colossuslab.org</a>
        </div>
      </div>
      <p className="colophon-line">Fuentes: INDEC y Ministerio de Seguridad de la Nación · Código bajo licencia MIT · Fotos con licencia propia</p>
    </footer>
  );
}
