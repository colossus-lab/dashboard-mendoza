import type { ValueFormat } from '../types/report';

const INT = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const DEC1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatValue(value: number | null | undefined, format: ValueFormat = 'int', unit?: string): string {
  if (value == null || !Number.isFinite(value)) return 'sin dato';
  const number = format === 'pct' ? `${DEC1.format(value)} %` : format === 'dec1' ? DEC1.format(value) : INT.format(value);
  return unit ? `${number} ${unit}` : number;
}

// Versión corta para ejes.
export function formatCompact(value: number, format: ValueFormat = 'int'): string {
  const abs = Math.abs(value);
  if (format === 'pct') return `${INT.format(abs)} %`;
  if (abs >= 1_000_000) return `${DEC1.format(abs / 1_000_000)} M`;
  if (abs >= 1_000) return `${INT.format(abs / 1_000)} mil`;
  return format === 'dec1' ? DEC1.format(abs) : INT.format(abs);
}

export function formatShare(value: number, total: number): string {
  return total ? `${DEC1.format((value / total) * 100)} %` : '';
}

const ROMAN: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function toRoman(n: number): string {
  let rest = n;
  let out = '';
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}
