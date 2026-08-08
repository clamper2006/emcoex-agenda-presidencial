import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

// Mismo orden de carga que index.html original: themes -> base -> layout ->
// components -> animations. El CSS no se reescribió, solo se importa tal
// cual desde src/styles (Vite lo empaqueta y lo referencia con hash).
import './styles/themes.css';
import './styles/base.css';
import './styles/layout.css';
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
