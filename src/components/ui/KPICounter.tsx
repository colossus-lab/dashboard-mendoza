import { useEffect, useRef, useState } from 'react';

interface KPICounterProps {
  formatted: string;
  label: string;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
  comparison?: string;
}

const STATUS_LABEL = { warning: 'A vigilar', critical: 'Alerta' };

// Solo anima cifras puras ("2.043.540", "+35,1 %"). El valor final siempre es
// `formatted`, así un KPI nunca queda en 0 si la animación no corre.
const ANIMABLE = /^([+-]?)(\d[\d.]*)(?:,(\d+))?(\D*)$/;

export function KPICounter({ formatted, label, unit, status, comparison }: KPICounterProps) {
  const [display, setDisplay] = useState(formatted);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const match = formatted.match(ANIMABLE);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || !match || reduce) return;

    const [, sign, whole, decimals = '', suffix] = match;
    const target = Number(`${whole.replace(/\./g, '')}.${decimals || 0}`);
    const number = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals.length,
      maximumFractionDigits: decimals.length,
    });
    let frame = 0;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 900, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(progress < 1 ? `${sign}${number.format(target * eased)}${suffix}` : formatted);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      setDisplay(formatted);
    };
  }, [formatted]);

  return (
    <div ref={ref} className="kpi" data-status={status}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        <span aria-hidden="true">{display}</span>
        <span className="sr-only">{formatted}</span>
        {unit && <span className="kpi-unit"> {unit}</span>}
      </span>
      {comparison && <span className="kpi-comparison">{comparison}</span>}
      {status && status !== 'good' && <span className="kpi-tag">{STATUS_LABEL[status]}</span>}
    </div>
  );
}
