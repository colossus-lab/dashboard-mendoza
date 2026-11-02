import { Photo, PHOTO_CREDITS } from '../components/ui/Photo';
import { usePageMeta } from '../hooks/usePageMeta';

const SOURCES = [
  {
    name: 'INDEC — Censo Nacional de Población, Hogares y Viviendas 2022',
    use: 'Informes de población. Cuadros provinciales para Mendoza.',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165',
  },
  {
    name: 'Ministerio de Seguridad de la Nación — SNIC',
    use: 'Informes de seguridad: hechos delictivos por provincia y departamento, 2000-2024, y muertes viales, 2017-2023.',
    url: 'https://datos.gob.ar/dataset/seguridad-snic-provincial',
  },
  {
    name: 'IGN / JGM',
    use: 'Geometría de los 18 departamentos para los mapas.',
    url: 'https://www.ign.gob.ar',
  },
];

export function Credits() {
  usePageMeta('Créditos y fuentes', 'Fuentes de datos, autores y licencias de las fotos de Mendoza, en datos.', '/creditos');

  return (
    <div className="credits container">
      <header className="section-header">
        <p className="eyebrow">Créditos</p>
        <h1 className="section-title">Fuentes y fotos</h1>
        <p className="section-lede">Quién produjo los datos y las imágenes que usa este sitio, y bajo qué licencia.</p>
      </header>

      <section aria-labelledby="fuentes-datos">
        <h2 id="fuentes-datos" className="report-section-title">Datos</h2>
        <ul className="credits-sources">
          {SOURCES.map(source => (
            <li key={source.name}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
              <span>{source.use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fotos">
        <h2 id="fotos" className="report-section-title">Fotos</h2>
        <p>
          Todas las fotos provienen de Wikimedia Commons. Se redimensionaron y se convirtieron a WebP; el
          tratamiento de color se aplica al mostrarlas. La licencia MIT del código no las cubre: cada una
          mantiene la suya.
        </p>
        <div className="credits-grid">
          {Object.values(PHOTO_CREDITS).map(photo => (
            <figure key={photo.key} className="credits-item">
              <Photo imageKey={photo.key} sizes="(min-width: 700px) 33vw, 100vw" />
              <figcaption>
                <strong>{photo.place}</strong>
                <span>Autor: {photo.author}</span>
                <span>
                  Licencia:{' '}
                  {photo.licenseUrl
                    ? <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>
                    : photo.license}
                </span>
                <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Ver original en Commons →</a>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
