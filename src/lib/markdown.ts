// Parte un informe en bajada, introducción y secciones.
// Cada sección arranca en un título con ancla: `## 2. Tipo de vivienda {#tipos}`.
// Los gráficos y rankings se ubican por coincidencia exacta con esa ancla.

export interface ReportSection {
  id: string;
  /** Número del título en el .md ("2"), si lo tiene */
  number: number | null;
  heading: string;
  content: string;
}

export interface ParsedReport {
  dek: string;
  intro: string;
  sections: ReportSection[];
}

const ANCHORED = /^##\s+(.*?)\s*\{#([a-z0-9-]+)\}\s*$/;

export function parseReport(md: string): ParsedReport {
  let dek = '';
  const intro: string[] = [];
  const sections: ReportSection[] = [];
  let current: { section: ReportSection; lines: string[] } | null = null;

  const close = () => {
    if (current) sections.push({ ...current.section, content: current.lines.join('\n').trim() });
  };

  for (const line of md.split(/\r?\n/)) {
    if (line.trim() === '---' || line.startsWith('# ')) continue;

    const anchored = line.match(ANCHORED);
    if (anchored) {
      close();
      const numbered = anchored[1].match(/^(\d+)\.\s+(.*)$/);
      current = {
        section: {
          id: anchored[2],
          number: numbered ? Number(numbered[1]) : null,
          heading: numbered ? numbered[2] : anchored[1],
          content: '',
        },
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    } else if (line.startsWith('## ')) {
      dek = line.replace(/^##\s+/, '');
    } else {
      intro.push(line);
    }
  }
  close();

  return { dek, intro: intro.join('\n').trim(), sections };
}
