import { useState } from 'react';
import type { ReportEntry, ReportData } from '../../types/report';

interface Props {
  report: ReportEntry;
  data: ReportData;
}

export function CitationBox({ report, data }: Props) {
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const cite =
    `Colossus Lab (${year}). ${report.title}. ` +
    `Mendoza, en datos · OpenArg. Fuente original: ${data.meta.source}. ` +
    `Recuperado el ${today} de https://mendoza.openarg.org/${report.slug}`;

  function copyCite() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(cite).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <details className="citation">
      <summary>Citar este informe</summary>
      <blockquote>{cite}</blockquote>
      <button onClick={copyCite} className="text-button" type="button">
        {copied ? 'Copiado' : 'Copiar cita →'}
      </button>
    </details>
  );
}
