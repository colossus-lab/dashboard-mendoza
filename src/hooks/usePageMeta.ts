import { useEffect } from 'react';

const SITE = 'Mendoza, en datos';
const ORIGIN = 'https://mendoza.openarg.org';

function setContent(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

// Título, descripción y URL canónica por página.
export function usePageMeta(title: string | null, description: string, path: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — OpenArg`;
    const url = `${ORIGIN}${path}`;
    document.title = fullTitle;
    setContent('meta[name="description"]', description);
    setContent('meta[property="og:title"]', fullTitle);
    setContent('meta[property="og:description"]', description);
    setContent('meta[property="og:url"]', url);
    setContent('meta[name="twitter:title"]', fullTitle);
    setContent('meta[name="twitter:description"]', description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  }, [title, description, path]);
}
