import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { IntroHero } from './components/ui/IntroHero';
import { useFirstVisit } from './hooks/useFirstVisit';
import { REPORTS } from './data/reportRegistry';

// Los informes y sus gráficos (nivo) no se cargan en la portada.
const ReportView = lazy(() => import('./pages/ReportView').then(m => ({ default: m.ReportView })));
const Credits = lazy(() => import('./pages/Credits').then(m => ({ default: m.Credits })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function FirstVisitIntro() {
  const { isFirst, dismiss } = useFirstVisit();
  const location = useLocation();
  if (!isFirst || location.pathname !== '/') return null;
  return <IntroHero onDismiss={dismiss} />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="state-page">
          <p className="eyebrow">Error</p>
          <h1 className="section-title">Algo no salió como esperábamos.</h1>
          <p>Volvé a cargar la página. Si el problema sigue, escribinos a devops@colossuslab.org.</p>
          <a className="text-link" href="/">Volver a la portada →</a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <FirstVisitIntro />
        <Layout>
          <Suspense fallback={<div className="state-page" aria-busy="true">Cargando…</div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              {REPORTS.map(report => (
                <Route key={report.id} path={`/${report.slug}`} element={<ReportView report={report} />} />
              ))}
              <Route path="/creditos" element={<Credits />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      <Analytics />
    </ErrorBoundary>
  );
}

