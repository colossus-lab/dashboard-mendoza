import { useCallback, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
// useFirstVisit — true solo la primera vez que el navegador abre el
// dashboard (flag persistido en localStorage bajo `mendoza-intro-seen`).
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'mendoza-intro-seen';

export function useFirstVisit() {
  const [isFirst, setIsFirst] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      // Si localStorage está bloqueado, no mostramos el intro (menos
      // intrusivo que mostrarlo en cada carga).
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setIsFirst(false);
  }, []);

  return { isFirst, dismiss };
}
