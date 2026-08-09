import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

// Orden de carga: tailwind (base + utilidades reales) -> themes -> base ->
// components -> animations. tailwind.css va primero para que sus reglas de
// utilidad no le ganen la cascada a los overrides de marca (--accent,
// .btn-primary, .card, etc.) que vienen después.
// Iteración (instalación real de Tailwind): layout.css se eliminó — era
// casi en su totalidad un clon incompleto a mano de utilidades de Tailwind
// (min-h-screen, flex, gap-*, grid-cols-*, md:*, etc.), ahora generadas de
// verdad por Tailwind. Las 2 clases de ese archivo que no eran Tailwind
// (.bg-brand-glow, .bg-brand-preview-bar) se movieron a components.css.
import './styles/tailwind.css';
import './styles/themes.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

// Antes: navigator.serviceWorker.register('./service-worker.js') a mano en
// app.js. Ahora vite-plugin-pwa genera el service worker (con los nombres
// de archivo hasheados de cada build) y expone este helper para registrarlo.
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
