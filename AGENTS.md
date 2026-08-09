# AGENTS.md — Agenda Presidencial Emcoex

> **Este documento es la única fuente de verdad (Single Source of Truth) de este repositorio.**
>
> Antes de escribir una sola línea de código, léelo completo. Al finalizar cada iteración de desarrollo, actualízalo para reflejar el estado real del proyecto.

---

# IDENTIDAD DEL PROYECTO

## Nombre

Agenda Presidencial Emcoex (`emcoex-agenda-presidencial`)

## Cliente

Empresa de Comercio Exterior del Estado Lara (EMCOEX Lara)

## Objetivo

Agenda ejecutiva de bolsillo para el presidente de Emcoex: captura rápida de cierres mensuales, despachos y proveedores, con KPIs, gráficos y reportes PDF. Como Progressive Web App instalable.

## Relación con ERP-Comex (Emcoex-Sistema-App)

**Este repositorio es un proyecto completamente aparte del ERP-Comex original.** Comparte el mismo proyecto de Supabase (misma URL, mismo panel), pero:

- No comparte tablas. Las tablas del ERP (`despachos`, `proveedores`, `historial_estados`, `usuarios`, etc.) pertenecen a `Emcoex-Sistema-App`, que quedó archivado — nunca se leen ni se escriben desde aquí.
- Este proyecto tiene sus propias tablas, con prefijo `agenda_` (`agenda_cierres`, `agenda_despachos`, `agenda_proveedores`), definidas en `supabase/agenda_schema.sql`.
- No comparte código fuente ni componentes con el ERP, aunque el estilo de algunos (Sidebar, DynamicForm, RecordsTable, Icon) se portó como punto de partida por consistencia visual.

---

# MI ROL

Soy el Product Owner y Tech Lead. Tú eres el Arquitecto Principal del proyecto. Cada recomendación debe priorizar simplicidad, mantenibilidad y no romper lo que ya funciona.

---

# REGLAS DE ESTE PROYECTO

1. **Un solo usuario, sin roles.** La app la usa una sola persona (el presidente). No existe tabla de roles ni lógica de roles — `AuthContext.jsx` autoriza comparando el email de la cuenta de Google contra `VITE_PRESIDENTE_EMAIL`. Cualquier otra cuenta que inicie sesión ve una pantalla de "no autorizado".
2. **Tablas propias, separadas del ERP archivado.** Nunca leer, escribir, ni referenciar tablas del esquema de `Emcoex-Sistema-App` (`erp_comex_schema.sql`). Todo lo nuevo va en tablas con prefijo `agenda_`.
3. **RLS por dueño de fila, no por rol.** Cada tabla tiene columna `usuario_id uuid default auth.uid()`, y las 4 políticas (select/insert/update/delete) exigen `usuario_id = auth.uid()`. No se necesita una tabla `usuarios` ni un enum de roles para esto — es la forma más simple de proteger los datos server-side dado que solo hay un usuario autorizado.
4. **No tocar autenticación.** El login con Google (PKCE) y la resolución de autorización por email ya funcionan (ver `AuthContext.jsx`) y no se tocan salvo pedido explícito.

---

# TECNOLOGÍAS OFICIALES

- React 19 (componentes funcionales + Hooks)
- Vite (bundler y dev server)
- Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`) — instalado en la Iteración 2, ver más abajo. Sin `tailwind.config.js`: el plugin de Vite de v4 escanea el proyecto automáticamente, la única config es `@import "tailwindcss";` en `src/styles/tailwind.css`.
- lucide-react (íconos)
- vite-plugin-pwa (manifest + service worker)
- @supabase/supabase-js — Auth (Google OAuth + PKCE) **y ahora persistencia real** (Iteración: migración a Supabase)
- jspdf / jspdf-autotable (reportes PDF)
- JavaScript ES6+ (JSX). Sin TypeScript.
- Sin librería de estado externa — Context API + useState.

---

# ARQUITECTURA DEL PROYECTO

```text
emcoex-agenda-presidencial/
    index.html
    vite.config.js          (base GH Pages + vite-plugin-pwa + plugin de Tailwind)
    package.json
    .env.example             (documenta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_PRESIDENTE_EMAIL)
    supabase/
        agenda_schema.sql     (las 3 tablas agenda_* + RLS — pegar en el SQL Editor de Supabase)
    src/
        main.jsx
        App.jsx
        lib/
            supabaseClient.js  (cliente Supabase, flowType: 'pkce', sin cambios)
            pdfReport.js       (Iteración 2: isotipo real embebido, portada, resumen visual de KPIs)
        context/
            AuthContext.jsx    (sesión + autorización por email, sin cambios)
            ThemeContext.jsx
            ToastContext.jsx
        data/
            agendaConfig.js    (SECTIONS: campos de cada sección — única fuente de verdad
                                 de qué campos existen; el esquema SQL debe reflejarla 1:1)
        utils/
            storage.js         (Iteración: antes LocalStorage, ahora Supabase — getRecords/
                                 saveRecord/deleteRecordItem, misma firma, ahora async)
            onboarding.js      (Iteración 2: hasSeenTour/markTourSeen — flag de localStorage,
                                 preferencia de UI, nunca pasa por Supabase)
        components/
            common/Icon.jsx
            common/WelcomeTour.jsx  (Iteración 2: tutorial de bienvenida, 1 paso por función)
            screens/AgendaScreen.jsx  (único consumidor de storage.js; maneja loading/busy)
            dashboard/KpiGrid.jsx, LineChart.jsx, DonutChart.jsx, DynamicForm.jsx, RecordsTable.jsx
        styles/
            tailwind.css (Iteración 2: `@import "tailwindcss";`, se carga primero)
            themes.css / base.css / components.css / animations.css
```

---

# ESTADO ACTUAL DEL PROYECTO

## Persistencia (Iteración 1 — migración de localStorage a Supabase)

- **Antes:** las 3 secciones (`cierres`, `despachos`, `proveedores`) guardaban en `localStorage` vía `src/utils/storage.js` (`getRecords`/`saveRecord`/`deleteRecordItem`, síncronas).
- **Ahora:** las mismas 3 funciones, mismo nombre y mismos parámetros, pero **asíncronas** y respaldadas por Supabase (`supabase.from(key).select/insert/delete`). `key` sigue siendo el mismo string que ya usaba localStorage (`SECTIONS[x].key` en `agendaConfig.js`) y ahora se usa directamente como nombre de tabla — es el mismo string por diseño (`agenda_cierres`, `agenda_despachos`, `agenda_proveedores`), así que no hizo falta una tabla de mapeo aparte.
- `id`, `created_at` y `usuario_id` ya no los genera el cliente (antes `crypto.randomUUID()` + `new Date().toISOString()` en `AgendaScreen.jsx`) — los resuelve el esquema SQL con `default gen_random_uuid()`, `default now()` y `default auth.uid()`. El cliente solo manda los campos del formulario.
- **Único componente modificado:** `AgendaScreen.jsx` (pasó de leer síncrono con `useMemo` a cargar con `useEffect` + estado `loading`/`busy`, y sus handlers `handleSave`/`handleDelete` ahora son `async`). `DynamicForm.jsx` y `RecordsTable.jsx` no se tocaron — siguen recibiendo arrays de records y callbacks síncronos desde su perspectiva, exactamente igual que antes.
- **RLS:** activado en las 3 tablas, política única por operación (select/insert/update/delete) que exige `usuario_id = auth.uid()`. No hay lógica de roles porque no hace falta: solo hay un usuario autorizado (capa de aplicación) y RLS solo necesita evitar que una fila de un usuario la lea/edite otro.

## Interfaz visual real con Tailwind CSS (Iteración 2 — instalación de raíz, PDF, onboarding)

- **Diagnóstico:** todo el JSX de la app ya usaba clases estilo Tailwind (`flex`, `gap-3`, `md:sticky`, `-translate-x-full`, `transition-transform`, `disabled:opacity-60`, etc.), pero el paquete `tailwindcss` nunca se instaló. En su lugar había un subconjunto de CSS a mano en `src/styles/layout.css`/`base.css` tratando de clonarlo, **incompleto** — por eso el sidebar nunca se ocultaba en móvil (el botón hamburguesa sí cambiaba el estado de React, pero `-translate-x-full`/`translate-x-0`/`transition-transform`/`md:sticky` no existían como CSS real).
- **Fix de raíz:** se instaló `tailwindcss@4` + `@tailwindcss/vite@4` de verdad. `src/styles/layout.css` se eliminó por completo (era casi en su totalidad un clon incompleto de utilidades Tailwind); sus 2 reglas genuinamente custom (`.bg-brand-glow`, `.bg-brand-preview-bar`, gradientes de marca con nombre) se movieron a `components.css`. Nuevo `src/styles/tailwind.css` con `@import "tailwindcss";`, importado primero en `main.jsx` para que sus capas base/utilities no le ganen la cascada a los overrides de marca (`--accent`, `.btn-primary`, `.card`, etc.) que cargan después.
- **Auditoría del mismo patrón (no solo lo ya reportado):** se recorrió todo el JSX buscando otros casos. Se encontraron 2 adicionales:
  - `bg-[var(--accent-soft)]` en `AgendaScreen.jsx` (ítem activo del sidebar) y `LandingScreen.jsx` (íconos de features) — la variable CSS `--accent-soft` **nunca existió** en `themes.css` (solo existe `--accent-tint`). Corregido a `--accent-tint`.
  - `w-4.5 h-4.5` en `LandingScreen.jsx` — `4.5` no existe en la escala default de espaciado de Tailwind (no lo hubiera generado ni instalando el paquete real). Corregido a `w-5 h-5`.
- **Los 5 íconos faltantes** (`calendar-check`, `file-down`, `percent`, `plus`, `trending-down`) agregados al mapa de `Icon.jsx`, verificados contra los exports reales del paquete `lucide-react` instalado.
- **Botón "Volver al inicio"** (`LoginScreen.jsx`): no tenía ninguna clase de botón — ahora usa `btn-ghost` + `rounded-xl`, la misma convención que el resto de la app (ver `NoAutorizadoScreen.jsx`).
- **Logo responsive** (`LandingScreen.jsx`): `emcoex-logo-completo.png` (629×319px) solo tenía altura fija sin límite de ancho. Ahora `h-10 w-auto max-w-[85vw] sm:h-14 object-contain` — techo duro de ancho que nunca se cruza, y altura menor en móvil.
- **PDF rediseñado** (`src/lib/pdfReport.js`, ahora `exportSectionPdf`/`exportGeneralPdf` son `async`): isotipo real (`public/brand/emcoex-isotipo.png`) embebido vía `fetch` + base64 (con fallback silencioso a solo texto si falla, nunca bloquea la generación del PDF), portada simple (isotipo, nombre del reporte, fecha) antes del contenido, y resumen visual de KPIs en tarjetas (no tabla) antes del detalle — en el reporte general y en la sección `cierres` (única con `computeKpis()` definido en `agendaConfig.js`; `despachos`/`proveedores` van directo de portada a tabla en vez de inventar métricas que la app no calcula en ningún otro lugar).
- **Tutorial de bienvenida** (`WelcomeTour.jsx`, nuevo): se muestra automático solo la primera vez (flag en `localStorage` vía `utils/onboarding.js` — preferencia de UI, no dato de negocio, nunca toca Supabase), un paso por función principal (Dashboard, Cierres, Despachos, Proveedores, Exportar PDF), cada uno con ícono de `lucide-react` + una animación CSS distinta y relacionada (`.tour-icon-*` en `animations.css`: pulso para Dashboard, pop para Cierres, balanceo para Despachos, elevación para Proveedores, caída para Exportar PDF). Botón "Ver tutorial" en el sidebar para volver a verlo manualmente.
- **Build real verificado:** `npm run build` compila sin errores (2047 módulos). Se confirmó por inspección del CSS generado (no captura de pantalla — este entorno no tiene navegador disponible) que las clases antes rotas ahora compilan a reglas reales: `.-translate-x-full`, `.translate-x-0`, `.transition-transform` y, dentro de `@media (width>=48rem)` (breakpoint `md:` de Tailwind = 768px), `.md\:sticky{position:sticky}` y `.md\:translate-x-0`. Se confirmó también que las clases custom (`.btn-ghost`, `.glass-strong`, `.modal-backdrop`, `.bg-mesh`, `.bg-brand-glow`, `.tour-icon-*`) sobrevivieron la migración.

## Deuda técnica identificada

1. **Sin manejo de conflictos de red offline** — si `saveRecord`/`deleteRecordItem` falla (sin conexión), se muestra un toast de error y no se pierde el formulario, pero no hay reintento automático ni cola offline. Aceptable para el MVP de un solo usuario; si se vuelve un problema real, la solución sería un patrón Outbox similar al que ya está en el roadmap de fase 5 del ERP original.
2. **`update` de registros no tiene UI todavía** — las políticas RLS de `update` ya existen en el esquema SQL (por si se necesitan a futuro), pero ningún componente las usa hoy: solo hay alta (`insert`) y baja (`delete`), no edición.
3. **Isotipo del PDF depende de `fetch` al mismo origen** (Iteración 2) — si algún día el hosting de `public/brand/` cambia a un CDN externo con CORS restrictivo, el fallback a solo texto en el header/portada del PDF se activa en silencio, sin avisar al usuario que el logo no se pudo embeber. No es un problema hoy (GitHub Pages, mismo origen), pero vale la pena un toast de aviso si eso cambia.

## Decisiones de arquitectura pendientes

- Si en el futuro se necesita editar un registro ya guardado (no solo crear/borrar), se puede agregar sin tocar el esquema SQL — las políticas `update` ya están.
- Paginación: hoy `getRecords` trae todas las filas del usuario sin límite. Con un solo usuario y captura manual, no debería crecer a un volumen problemático a corto plazo, pero es la primera cosa a revisar si la tabla `agenda_despachos` empieza a sentirse lenta.

---

# MANTENIMIENTO DE ESTE DOCUMENTO

Debes marcar funcionalidades completadas/pendientes, decisiones de arquitectura tomadas, estructura actual del proyecto y próximos pasos recomendados. Este documento siempre debe representar el estado REAL del proyecto. Cada iteración completada debe registrarse en `CHANGELOG.md`.
