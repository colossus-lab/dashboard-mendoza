import { formatValue } from '../../lib/format';
import type { RankingConfig } from '../../types/report';

export function RankingTable({ ranking }: { ranking: RankingConfig }) {
  const max = Math.max(...ranking.items.map(item => Math.abs(item.value)), 0);

  return (
    <figure className="figure ranking">
      <figcaption className="figure-title">{ranking.title}</figcaption>
      <table className="ranking-table">
        <thead>
          <tr>
            <th scope="col" className="sr-only">Posición</th>
            <th scope="col">Nombre</th>
            <th scope="col" className="ranking-num">{ranking.unit ?? 'Valor'}</th>
          </tr>
        </thead>
        <tbody>
          {ranking.items.map((item, i) => (
            <tr key={item.name} className={item.municipioId === '50' ? 'is-highlight' : undefined}>
              <td className="ranking-pos">{i + 1}</td>
              <td className="ranking-name">
                {item.name}
                <span
                  className="ranking-bar"
                  aria-hidden="true"
                  style={{ width: `${max ? (Math.abs(item.value) / max) * 100 : 0}%` }}
                />
              </td>
              <td className="ranking-num">{formatValue(item.value, ranking.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
