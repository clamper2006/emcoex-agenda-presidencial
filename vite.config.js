import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

// Nombre del repositorio en GitHub. GitHub Pages sirve el sitio en
// https://<usuario>.github.io/<REPO_NAME>/, así que "base" debe coincidir
// exactamente con el nombre del repo para que los assets del build (JS/CSS
// con hash) se resuelvan bien bajo ese subpath.
// Confirmado: https://clamper2006.github.io/Emcoex-Sistema-App/
const REPO_NAME = 'Emcoex-Sistema-App';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  // El bundle creció al agregar @supabase/supabase-js (Iteración 9): es
  // una librería grande porque empaqueta auth + postgrest + realtime +
  // storage juntos, aunque solo usemos auth y una consulta simple. No
  // hay una versión "solo auth" del paquete para hacer tree-shaking real
  // de eso. Lo que sí se puede hacer gratis es separar el código de
  // terceros (que casi no cambia entre builds) del código propio de la
  // app (que sí cambia seguido), para que el navegador pueda cachear el
  // vendor chunk por separado y no tenga que re-descargarlo en cada
  // deploy nuevo.
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 usa Rolldown, que solo acepta manualChunks como función
        // (la forma de objeto/mapa de Rollup clásico no es válida acá).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react-router-dom') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  plugins: [
    // Tailwind real (Iteración: instalación de raíz). Todo el JSX ya usaba
    // clases estilo Tailwind (flex, gap-3, md:sticky, -translate-x-full,
    // transition-transform, disabled:opacity-60, etc.) pero Tailwind nunca
    // estuvo instalado — había un subconjunto de CSS a mano en
    // src/styles/layout.css y base.css tratando de clonarlo, incompleto
    // (por eso el sidebar nunca se ocultaba en móvil: -translate-x-full,
    // translate-x-0, transition-transform y md:sticky no existían). El
    // plugin de Vite de Tailwind v4 no necesita tailwind.config.js ni
    // content: [...] — escanea los archivos del proyecto automáticamente.
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registramos el SW a mano en main.jsx con `virtual:pwa-register`,
      // así que le pedimos al plugin que NO inyecte otro script de registro
      // (el <link rel="manifest"> sí lo sigue inyectando automáticamente).
      injectRegister: false,
      // El manifest y el service worker se generan a partir de la
      // configuración de Vite: los nombres de archivo con hash de cada
      // build quedan precacheados automáticamente por Workbox, así que
      // no hace falta (ni funcionaría) reutilizar service-worker.js tal cual.
      // Íconos reales de EMCOEX (isotipo: sol naranja + hoja verde), servidos
      // como archivos estáticos desde public/icons/ — ya no como SVG inline.
      // Dos propósitos por tamaño porque no son intercambiables:
      // "any" = el isotipo tal cual, sin recortar. "maskable" = el mismo
      // isotipo con relleno blanco y más margen interno, porque Android/iOS
      // recortan estos íconos a distintas formas (círculo, squircle, etc.)
      // y sin ese margen de seguridad las puntas del sol quedarían cortadas.
      manifest: {
        name: 'EMCOEX | ERP-Comex',
        short_name: 'EMCOEX',
        description: 'ERP-Comex: plataforma de gestión de comercio exterior de EMCOEX Lara.',
        start_url: '.',
        display: 'standalone',
        background_color: '#fbf9f5',
        theme_color: '#fbf9f5',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icons/icon-192-any.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-any.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // includeAssets: assets fuera de src/ que Workbox debe precachear pero
      // que no pasan por el pipeline de build de Vite (favicon, apple-touch-icon).
      includeAssets: ['favicon.png', 'icons/*.png', 'brand/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png}'],
      },
    }),
  ],
});
