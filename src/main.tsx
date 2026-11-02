import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/familjen-grotesk';
import '@fontsource-variable/familjen-grotesk/wght-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/report.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
