# Agenda Emcoex — Presidencial

Pivote del proyecto ERP-Comex (multi-rol) hacia una agenda ejecutiva de un
solo usuario: el presidente de Emcoex. Le permite capturar cierres
mensuales, despachos y proveedores, ver estadísticas globales, y exportar
todo (o cada sección) como PDF listo para imprimir.

## Origen de este repo

Este proyecto nace de `erp-comex-react` (el ERP completo de 9 roles).
Se reutilizaron: marca visual, hoja de estilos, componentes de gráficos
(adaptados a datos reales), patrón de conexión a Supabase y el pipeline
de despliegue. Se descartó: todo el sistema de roles, permisos y
dashboards por rol (queda documentado en el repo viejo, sin tocar).

## Stack

- React 19 + Vite + React Router (HashRouter, compatible con GitHub Pages)
- Supabase (Auth con Google) — por ahora los datos viven en LocalStorage,
  listos para migrarse a tablas de Supabase cuando se decida
- jsPDF + jspdf-autotable para los reportes

## Setup

```bash
npm install
cp .env.example .env   # completa tus credenciales de Supabase y el email del presidente
npm run dev
```

## Próximos pasos sugeridos

1. Conectar `agenda_cierres` / `agenda_despachos` / `agenda_proveedores`
   a tablas reales de Supabase (RLS: solo el email del presidente puede
   leer/escribir) en vez de LocalStorage.
2. Revisar con el presidente qué otros datos quiere ver además de las
   3 secciones actuales (legal, personal, otro negocio, etc.)
3. Pulir el diseño del PDF con el equipo (logo, colores exactos de marca).
4. Deploy a GitHub Pages para compartir el link de preview.
