# CHANGELOG — Agenda Presidencial Emcoex

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
