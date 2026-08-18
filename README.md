# EMCOEX — Agenda Presidencial

Agenda ejecutiva de bolsillo para el presidente de EMCOEX Lara: captura
cierres mensuales, despachos y proveedores, ve estadísticas globales
(KPIs, gráficos) y exporta todo — o cada sección por separado — como PDF
listo para imprimir. Progressive Web App instalable.

## Origen de este repo

Este proyecto partió de `erp-comex-react` (el ERP completo de 9 roles,
archivado como `Emcoex-Sistema-App`) como punto de partida visual: se
reutilizaron la marca, la hoja de estilos, el patrón de conexión a
Supabase y el pipeline de despliegue. No comparte tablas, roles ni
dashboards con ese proyecto — ver `AGENTS.md` para el detalle completo de
la relación entre ambos.

## Stack

- React 19 + Vite + Tailwind CSS 4
- Supabase: autenticación (Google OAuth vía PKCE) y persistencia de datos
  (tablas `agenda_cierres` / `agenda_despachos` / `agenda_proveedores`,
  con Row Level Security por dueño de fila — ver `supabase/agenda_schema.sql`)
- jsPDF + jspdf-autotable para los reportes exportables
- vite-plugin-pwa (manifest + service worker, instalable como PWA)
- Despliegue automático a GitHub Pages vía GitHub Actions

## Setup

```bash
npm install
cp .env.example .env   # completa tus credenciales de Supabase
npm run dev
```

`VITE_PRESIDENTE_EMAIL` es opcional: si se deja sin definir (etapa actual
de pruebas), cualquier cuenta de Google autenticada puede entrar. Cuando
se defina, solo esa cuenta queda autorizada y el resto ve la pantalla "no
autorizado" — ver `.env.example` y `AGENTS.md` para el detalle.

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción a dist/
npm run preview   # sirve el build de dist/ localmente
```

## Documentación

- `AGENTS.md` — arquitectura, decisiones y estado real del proyecto (única
  fuente de verdad técnica; léelo antes de tocar código).
- `CHANGELOG.md` — historial de iteraciones completadas.
