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
    vite.config.js          (base GH Pages + vite-plugin-pwa)
    package.json
    .env.example             (documenta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_PRESIDENTE_EMAIL)
    supabase/
        agenda_schema.sql     (las 3 tablas agenda_* + RLS — pegar en el SQL Editor de Supabase)
    src/
        main.jsx
        App.jsx
        lib/
            supabaseClient.js  (cliente Supabase, flowType: 'pkce', sin cambios)
            pdfReport.js
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
        components/
            common/Icon.jsx
            screens/AgendaScreen.jsx  (único consumidor de storage.js; maneja loading/busy)
            dashboard/KpiGrid.jsx, LineChart.jsx, DonutChart.jsx, DynamicForm.jsx, RecordsTable.jsx
        styles/
            themes.css / base.css / layout.css / components.css / animations.css
```

---

# ESTADO ACTUAL DEL PROYECTO

## Persistencia (Iteración 1 — migración de localStorage a Supabase)

- **Antes:** las 3 secciones (`cierres`, `despachos`, `proveedores`) guardaban en `localStorage` vía `src/utils/storage.js` (`getRecords`/`saveRecord`/`deleteRecordItem`, síncronas).
- **Ahora:** las mismas 3 funciones, mismo nombre y mismos parámetros, pero **asíncronas** y respaldadas por Supabase (`supabase.from(key).select/insert/delete`). `key` sigue siendo el mismo string que ya usaba localStorage (`SECTIONS[x].key` en `agendaConfig.js`) y ahora se usa directamente como nombre de tabla — es el mismo string por diseño (`agenda_cierres`, `agenda_despachos`, `agenda_proveedores`), así que no hizo falta una tabla de mapeo aparte.
- `id`, `created_at` y `usuario_id` ya no los genera el cliente (antes `crypto.randomUUID()` + `new Date().toISOString()` en `AgendaScreen.jsx`) — los resuelve el esquema SQL con `default gen_random_uuid()`, `default now()` y `default auth.uid()`. El cliente solo manda los campos del formulario.
- **Único componente modificado:** `AgendaScreen.jsx` (pasó de leer síncrono con `useMemo` a cargar con `useEffect` + estado `loading`/`busy`, y sus handlers `handleSave`/`handleDelete` ahora son `async`). `DynamicForm.jsx` y `RecordsTable.jsx` no se tocaron — siguen recibiendo arrays de records y callbacks síncronos desde su perspectiva, exactamente igual que antes.
- **RLS:** activado en las 3 tablas, política única por operación (select/insert/update/delete) que exige `usuario_id = auth.uid()`. No hay lógica de roles porque no hace falta: solo hay un usuario autorizado (capa de aplicación) y RLS solo necesita evitar que una fila de un usuario la lea/edite otro.

## Deuda técnica identificada

1. **Sin manejo de conflictos de red offline** — si `saveRecord`/`deleteRecordItem` falla (sin conexión), se muestra un toast de error y no se pierde el formulario, pero no hay reintento automático ni cola offline. Aceptable para el MVP de un solo usuario; si se vuelve un problema real, la solución sería un patrón Outbox similar al que ya está en el roadmap de fase 5 del ERP original.
2. **`update` de registros no tiene UI todavía** — las políticas RLS de `update` ya existen en el esquema SQL (por si se necesitan a futuro), pero ningún componente las usa hoy: solo hay alta (`insert`) y baja (`delete`), no edición.

## Decisiones de arquitectura pendientes

- Si en el futuro se necesita editar un registro ya guardado (no solo crear/borrar), se puede agregar sin tocar el esquema SQL — las políticas `update` ya están.
- Paginación: hoy `getRecords` trae todas las filas del usuario sin límite. Con un solo usuario y captura manual, no debería crecer a un volumen problemático a corto plazo, pero es la primera cosa a revisar si la tabla `agenda_despachos` empieza a sentirse lenta.

---

# MANTENIMIENTO DE ESTE DOCUMENTO

Debes marcar funcionalidades completadas/pendientes, decisiones de arquitectura tomadas, estructura actual del proyecto y próximos pasos recomendados. Este documento siempre debe representar el estado REAL del proyecto. Cada iteración completada debe registrarse en `CHANGELOG.md`.
