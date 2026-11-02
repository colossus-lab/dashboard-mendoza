import { useEffect, useState } from 'react';
import landing from '../../data/generated/landing.json';

// ═══════════════════════════════════════════════════════════════════
// IntroHero — Overlay de bienvenida para la primera visita.
// Escribe el título caracter por caracter; el botón para entrar está
// disponible desde el inicio.
// ═══════════════════════════════════════════════════════════════════

const TITLE = `En Mendoza son ${landing.poblacionFmt} personas y vos.`;
const TYPE_SPEED = 55; // ms por caracter

interface Props {
  onDismiss: () => void;
}

export function IntroHero({ onDismiss }: Props) {
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [typed, setTyped] = useState(reduce ? TITLE : '');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setTyped(TITLE.slice(0, i));
      if (i >= TITLE.length) window.clearInterval(id);
    }, TYPE_SPEED);
    return () => window.clearInterval(id);
  }, [reduce]);

  const finished = typed.length >= TITLE.length;

  function handleDismiss() {
    if (leaving) return;
    if (reduce) {
      onDismiss();
      return;
    }
    setLeaving(true);
    window.setTimeout(onDismiss, 300);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') handleDismiss();
  }

  return (
    <div
      className={`intro ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a Mendoza, en datos"
      onKeyDown={handleKey}
    >
      <div className="intro-content">
        <p className="eyebrow">Mendoza, en datos</p>
        <p className="intro-title" aria-label={TITLE}>
          <span aria-hidden="true">{typed}</span>
          <span className={`intro-cursor ${finished ? 'is-done' : ''}`} aria-hidden="true">▌</span>
        </p>
        <div className="intro-text">
          <p>
            Construimos esta plataforma desde <strong>Colossus Lab</strong> para
            hacerle llegar a la gente de Mendoza una radiografía lo más completa
            que pudimos.
          </p>
          <p>
            Tu aporte siempre va a ser nuestro dato más significativo. Podés
            hacerlo a <a href="mailto:devops@colossuslab.org">devops@colossuslab.org</a>.
            Muchas gracias.
          </p>
        </div>
        <button type="button" className="button" onClick={handleDismiss} autoFocus>
          Entrar al dashboard →
        </button>
      </div>
    </div>
  );
}
