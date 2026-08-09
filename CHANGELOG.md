# CHANGELOG — Agenda Presidencial Emcoex

## Iteración 2 — Tailwind CSS real, rediseño de PDF y tutorial de bienvenida

Estado: ✅ Completada

Contexto: la autenticación y la persistencia en Supabase (Iteración 1) ya funcionaban bien — el problema era puramente visual. Diagnóstico confirmado directamente en el código: todo el JSX usaba clases estilo Tailwind (`flex`, `-translate-x-full`, `md:sticky`, `transition-transform`, `disabled:opacity-60`, etc.) pero el paquete `tailwindcss` nunca se instaló. En su lugar había un subconjunto de CSS a mano en `src/styles/layout.css`/`base.css` tratando de clonarlo, incompleto — el caso más visible era el sidebar: el botón hamburguesa sí cambiaba el estado de React (`sidebarOpen`), pero como `-translate-x-full`/`translate-x-0`/`transition-transform`/`md:sticky` no existían como CSS real, el panel se veía siempre, sin importar el estado.

Cambios:

- **Tailwind CSS instalado de raíz** (`tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3`, devDependencies). Plugin cableado en `vite.config.js`. Nuevo `src/styles/tailwind.css` con `@import "tailwindcss";`, importado primero en `main.jsx` (antes de `themes.css`/`base.css`/`components.css`/`animations.css`) para que las capas base/utilities de Tailwind no le ganen la cascada a los overrides de marca. Tailwind v4 no usa `tailwind.config.js`/`content: [...]` — el plugin de Vite escanea el proyecto automáticamente.
- **`src/styles/layout.css` eliminado por completo** — era, en el resto de su contenido, un clon incompleto a mano de utilidades de Tailwind (`min-h-screen`, `flex`, `grid-cols-*`, `md:*`, etc.), ahora generadas de verdad. Sus 2 reglas que no eran clones de Tailwind (`.bg-brand-glow`, `.bg-brand-preview-bar` — gradientes de marca con nombre propio) se movieron a `components.css`. `base.css` perdió también `.sidebar-mobile-hidden` (duplicaba `md:hidden`, que ahora ya funciona de verdad, y no se usaba en ningún componente).
- **Auditoría del mismo patrón, más allá de lo ya reportado** (pedido explícito: "confirma que no queden más casos"). Se recorrió todo el JSX cruzando cada clase contra la escala default de Tailwind y contra las variables CSS definidas en `themes.css`. 2 casos adicionales encontrados y corregidos:
  - `bg-[var(--accent-soft)]` en `AgendaScreen.jsx` (fondo del ítem de nav activo en el sidebar) y `LandingScreen.jsx` (fondo de los íconos de features) — `--accent-soft` **nunca estuvo definida** en `themes.css` (solo existe `--accent-tint`, pensada exactamente para este uso). El fondo simplemente no se pintaba. Corregido a `--accent-tint`.
  - `w-4.5 h-4.5` en `LandingScreen.jsx` — `4.5` no es un valor de la escala default de espaciado de Tailwind (existen `4` y `5`, no `4.5`), así que tampoco hubiera funcionado con el paquete real instalado. Corregido a `w-5 h-5`.
- **`src/components/common/Icon.jsx`**: agregados los 5 nombres de ícono que faltaban en el mapa — `calendar-check` (CalendarCheck), `file-down` (FileDown), `percent` (Percent), `plus` (Plus), `trending-down` (TrendingDown) — verificados uno por uno contra los exports reales de `lucide-react` instalado en el proyecto antes de usarlos.
- **`src/components/screens/LoginScreen.jsx`**: el botón "Volver al inicio" no tenía ninguna clase de botón (solo `hover:text-white transition inline-flex items-center gap-1`, dentro de un `<p>`). Ahora usa `btn-ghost rounded-xl` — la misma convención que ya usa `NoAutorizadoScreen.jsx` — y se movió de `<p>` a `<div>` (un `<button>` dentro de un `<p>` no es correcto semánticamente).
- **`src/components/screens/LandingScreen.jsx`**: el logo completo (`emcoex-logo-completo.png`, 629×319px) solo tenía altura fija (`h-14`), sin límite de ancho ni manejo responsive. Ahora `h-10 w-auto max-w-[85vw] sm:h-14 object-contain` — `max-w-[85vw]` es un techo duro que nunca se puede cruzar sin importar el viewport, la altura es menor en móvil y crece desde el breakpoint `sm:`.
- **`src/lib/pdfReport.js` (rediseñado, funciones ahora `async`)**:
  1. El isotipo real (`public/brand/emcoex-isotipo.png`) se embebe como imagen — antes el encabezado era solo texto (`doc.text('EMCOEX', ...)`). Se trae por `fetch` (está en `public/`, fuera del grafo de módulos de Vite, no se puede `import` directo) y se convierte a base64 con `FileReader`; si falla (sin red, asset movido) hay un `try/catch` que devuelve `null` y el PDF sigue generándose con el wordmark de texto solo — nunca bloquea la exportación.
  2. Portada simple: isotipo grande, nombre del reporte, fecha de generación — página 1 completa, antes del contenido con tablas.
  3. Resumen visual de KPIs (tarjetas 2x2, no tabla) antes de la tabla de detalle, usando `computeKpis()` de `agendaConfig.js` — mismos 4 KPIs que ya se calculan para el Dashboard. Se agrega en el reporte general y en la sección `cierres` (la única con KPIs definidos); `despachos`/`proveedores` van directo de la portada a su tabla, para no inventar métricas que la app no calcula en ningún otro lugar.
- **`src/components/common/WelcomeTour.jsx` (nuevo) + `src/utils/onboarding.js` (nuevo)**: tutorial de bienvenida que se muestra automáticamente solo la primera vez — flag `emcoex_agenda_tour_seen` en `localStorage` (preferencia de UI pura, mismo patrón que el tema claro/oscuro de `ThemeContext.jsx`, nunca pasa por Supabase). Un paso por función principal: Dashboard, Cierres mensuales, Despachos, Proveedores, Exportar PDF. Cada paso tiene su propio ícono de `lucide-react` con una animación CSS distinta y relacionada a la función (nuevas clases `.tour-icon-*` en `animations.css`): pulso para Dashboard (datos en vivo), pop para Cierres (como un check al confirmar), balanceo para Despachos (un barco navegando), elevación para Proveedores (directorio que crece), caída para Exportar PDF (el archivo bajando). Botón "Ver tutorial" agregado al sidebar de `AgendaScreen.jsx` para volver a verlo manualmente cuando sea.
- **Autenticación y capa de datos:** sin cambios — ningún archivo de `context/AuthContext.jsx`, `lib/supabaseClient.js` ni `utils/storage.js` se tocó, tal como pedía la restricción explícita de esta iteración.

Verificación:

- **Build real:** `npm install && npm run build` (sin `.env`, igual que un clone fresco) compiló sin errores — 2047 módulos transformados, CSS generado de 24.39 kB (6.16 kB gzip), `dist/` con manifest y service worker (32 entradas precacheadas, PWA v1.3.0).
- **Viewport móvil:** este entorno de trabajo no tiene un navegador disponible para capturas de pantalla reales (los CDN de descarga de Chromium de Playwright/Puppeteer no están en la lista blanca de red del sandbox), así que la verificación fue por inspección directa del CSS generado en `dist/assets/*.css` en vez de una captura visual:
  - `.-translate-x-full{--tw-translate-x:-100%;...}`, `.translate-x-0{--tw-translate-x:0px;...}` y `.transition-transform{transition-property:transform,translate,scale,rotate;...}` existen como reglas reales (antes, ninguna).
  - Dentro de `@media (width>=48rem)` (el breakpoint `md:` real de Tailwind, 768px): `.md\:sticky{position:sticky}` y `.md\:translate-x-0{--tw-translate-x:0px;...}` — confirma que el sidebar queda oculto fuera de pantalla por defecto en móvil y visible/en flujo normal desde 768px, exactamente el comportamiento que pedía el diagnóstico.
  - `disabled:opacity-60` y `hover:bg-white/5` también compilan a reglas reales.
  - Los 2 bugs adicionales quedaron confirmados arreglados en el CSS compilado: `.bg-\[var\(--accent-tint\)\]` existe, `w-4.5`/`h-4.5` no aparece en ningún lado del CSS generado.
  - Las clases custom (`.btn-ghost`, `.glass-strong`, `.modal-backdrop`, `.bg-mesh`, `.bg-brand-glow`, `.tour-icon-pulse`/`-pop`/`-sail`/`-rise`/`-drop`) sobrevivieron la migración y siguen en el bundle.
- **No se tocó autenticación ni capa de datos:** confirmado por revisión de diff — `AuthContext.jsx`, `supabaseClient.js` y `utils/storage.js` quedaron idénticos a la Iteración 1.

Fuera de alcance en esta iteración (no pedido): edición del logo/isotipo en sí (assets sin cambios, solo su CSS de contenedor); un loading state visible mientras se genera el PDF (la generación es casi instantánea al ser un asset local, no se agregó UI de progreso).

---

## Cómo aplicar esta iteración en producción

1. `npm install` — trae `tailwindcss` y `@tailwindcss/vite` como devDependencies nuevas. No hay migraciones SQL ni variables de entorno nuevas en esta iteración.
2. `npm run build` (o `npm run dev` para probar local) y confirmar visualmente: el sidebar se oculta/muestra con el botón hamburguesa en móvil, los 5 íconos antes rotos se ven, el botón "Volver al inicio" tiene fondo, el logo del landing no se desborda, y el tutorial de bienvenida aparece la primera vez que se entra a la agenda (se puede forzar de nuevo borrando `emcoex_agenda_tour_seen` de `localStorage`, o con el botón "Ver tutorial" del sidebar).

---

## Iteración 1 — Migración de LocalStorage a persistencia real en Supabase

Estado: ✅ Completada

Contexto: las 3 secciones de captura (Cierres mensuales, Despachos, Proveedores) guardaban sus registros solo en `localStorage`, sin persistencia real entre dispositivos ni backup. La app ya tenía autenticación real con Supabase (Google OAuth + PKCE, filtrada por `VITE_PRESIDENTE_EMAIL`), así que se usó el mismo proyecto de Supabase para agregar persistencia real, sin tocar ni reutilizar el esquema del ERP-Comex original (proyecto archivado, `Emcoex-Sistema-App`).

Cambios:

- **`supabase/agenda_schema.sql`** (nuevo): define 3 tablas nuevas — `agenda_cierres`, `agenda_despachos`, `agenda_proveedores` — con exactamente los mismos campos que ya estaban definidos en `src/data/agendaConfig.js` para cada sección (no se inventó ni se cambió ningún campo). Cada tabla incluye `id` (uuid, `default gen_random_uuid()`), `usuario_id` (uuid, `default auth.uid()`, referencia a `auth.users`) y `created_at` (`default now()`) — ninguno de estos 3 lo manda el cliente. RLS activado en las 3 tablas con 4 políticas cada una (select/insert/update/delete), todas exigiendo `usuario_id = auth.uid()`. Sin lógica de roles: no hace falta, es un solo usuario autorizado por capa de aplicación. Índices agregados por `(usuario_id, mes)`, `(usuario_id, fecha desc)` y `(usuario_id, nombre)` — mismo orden que ya usa la UI (`AgendaScreen.jsx` ordena cierres por mes, KPIs por fecha reciente).
- **`src/utils/storage.js`** (reescrito): `getRecords`, `saveRecord` y `deleteRecordItem` mantienen exactamente el mismo nombre y firma que la versión de LocalStorage, pero ahora son `async` y llaman a `supabase.from(key).select/insert/delete` en vez de `localStorage.getItem/setItem`. `key` sigue siendo el mismo string que definía `SECTIONS[x].key` en `agendaConfig.js` (`agenda_cierres`, `agenda_despachos`, `agenda_proveedores`) y ahora se usa directamente como nombre de tabla, así que no hizo falta agregar una tabla de mapeo. `saveRecord` ya no arma `{ id, created_at, ...values }` a mano (eso vivía antes en `AgendaScreen.jsx`, con `crypto.randomUUID()` + `new Date().toISOString()`) — ahora manda solo `values` y deja que el esquema SQL resuelva `id`/`created_at`/`usuario_id` con sus `default`.
- **`src/components/screens/AgendaScreen.jsx`** (único componente modificado además de `storage.js`): pasó de leer los 3 arrays de forma síncrona con `useMemo` a cargarlos con `useEffect` + `Promise.all`, con estados `loading` (carga inicial) y `busy` (mientras se guarda o borra, deshabilita el botón "Agregar" de cada sección para evitar doble submit). `handleSave`/`handleDelete` ahora son `async` y capturan errores de Supabase con un toast (`showToast('error', ...)`) en vez de asumir que la operación siempre funciona, que era una asunción válida con LocalStorage pero no con una llamada de red. **`DynamicForm.jsx` y `RecordsTable.jsx` no se tocaron** — desde su perspectiva siguen recibiendo un array de records y callbacks (`onSubmit`, `onDelete`), sin saber ni importarles que ahora hay una llamada async detrás.
- **Autenticación:** sin cambios. `AuthContext.jsx` sigue resolviendo autorización comparando el email de la sesión contra `VITE_PRESIDENTE_EMAIL`, ya funcionaba y no era parte del pedido.

Verificación:

- **Correspondencia de campos:** los 3 `CREATE TABLE` de `agenda_schema.sql` se armaron leyendo campo por campo `SECTIONS.cierres.fields`, `SECTIONS.despachos.fields` y `SECTIONS.proveedores.fields` en `agendaConfig.js` — mismo nombre, mismo orden, y tipo SQL elegido según el `type` de cada campo (`month`→`text` 'YYYY-MM', `number`→`numeric`/`integer`, `date`→`date`, `select`→`text` con `check` de las mismas opciones del `<select>`, `textarea`/`text`→`text`).
- **No se tocó el ERP original:** revisado que ningún nombre de tabla nueva coincide con `erp_comex_schema.sql` (que usa nombres sin prefijo: `despachos`, `proveedores`, etc., no `agenda_despachos`/`agenda_proveedores`), y que `agenda_schema.sql` no referencia ninguna tabla de ese archivo salvo `auth.users` (la tabla de Supabase Auth, común a cualquier proyecto, no del ERP).
- **Build real:** `npm install && npm run build` corrido en este entorno con credenciales de Supabase de prueba (placeholder, ya que el sandbox no tiene acceso de red a `supabase.co`). Compiló sin errores — 2045 módulos transformados, `dist/` generado con manifest y service worker (32 entradas precacheadas, PWA v1.3.0). No se pudo probar end-to-end contra una base de datos real en este entorno; ver instrucciones abajo para correrlo con las credenciales reales del proyecto.

Fuera de alcance en esta iteración (no pedido): UI para editar (`update`) un registro ya guardado — las políticas RLS de `update` quedaron creadas en el esquema por si se necesitan a futuro, pero hoy solo hay alta y baja. Manejo de cola offline / reintentos automáticos si falla la red al guardar.

---

## Cómo aplicar esta iteración en producción

1. **Supabase Dashboard → SQL Editor** → pegar el contenido completo de `supabase/agenda_schema.sql` → Run. Es idempotente, se puede correr más de una vez sin romper nada.
2. Confirmar que `.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del mismo proyecto de Supabase que ya usa el login (son las mismas variables que ya estaban configuradas para Auth, no hace falta agregar ninguna nueva).
3. `npm install && npm run build` (o `npm run dev` para probar local) y verificar que Cierres/Despachos/Proveedores lean y escriban contra Supabase en vez de perder los datos al limpiar el navegador.
