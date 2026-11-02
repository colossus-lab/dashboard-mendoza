import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export function NotFound() {
  usePageMeta('Página no encontrada', 'Esta página no existe en Mendoza, en datos.', '/');

  return (
    <div className="state-page">
      <p className="eyebrow">404</p>
      <h1 className="section-title">Esta página no existe.</h1>
      <p>Puede que el enlace esté mal escrito o que el informe se haya movido.</p>
      <Link to="/" className="text-link">Volver a la portada →</Link>
    </div>
  );
}
