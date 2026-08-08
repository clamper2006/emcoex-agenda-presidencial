-- ============================================================================
-- Agenda Presidencial Emcoex — esquema de persistencia (Iteración: migración
-- de localStorage a Supabase)
-- ============================================================================
-- IMPORTANTE: este esquema es PROPIO de este repositorio (emcoex-agenda-
-- presidencial). Aunque corre en el mismo proyecto de Supabase que
-- Emcoex-Sistema-App (ERP-Comex original), NO toca ni referencia ninguna
-- tabla de ese proyecto (despachos, proveedores, historial_estados,
-- usuarios, etc. pertenecen al ERP archivado y quedan intactas).
--
-- Diseño: app de un solo usuario (el presidente). No hay tabla de roles ni
-- lógica de roles — el filtro de "quién puede entrar" ya lo resuelve
-- AuthContext.jsx comparando el email de Google contra
-- VITE_PRESIDENTE_EMAIL. Estas políticas RLS son la segunda capa de
-- seguridad (server-side): cualquier usuario autenticado solo puede
-- leer/escribir SUS PROPIAS filas (usuario_id = auth.uid()), no filas de
-- otra cuenta que hipotéticamente se autentique.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → pegar este archivo
-- completo → Run. Es idempotente (create table if not exists / drop
-- policy if exists), se puede volver a correr sin romper nada.
-- ============================================================================

-- 1) agenda_cierres — mapea 1:1 los campos de SECTIONS.cierres en
--    src/data/agendaConfig.js
create table if not exists public.agenda_cierres (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  mes text not null,                     -- input type="month" -> 'YYYY-MM'
  ingresos numeric not null,
  costos numeric not null,
  despachos_cerrados integer not null,
  notas text
);

-- 2) agenda_despachos — mapea 1:1 los campos de SECTIONS.despachos
create table if not exists public.agenda_despachos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  proveedor text not null,
  incoterm text not null check (incoterm in ('FOB', 'CIF', 'EXW', 'DDP')),
  estado text not null check (estado in ('En tránsito', 'En aduana', 'Cerrado', 'Retrasado')),
  fecha date not null,
  monto numeric not null,
  notas text
);

-- 3) agenda_proveedores — mapea 1:1 los campos de SECTIONS.proveedores
create table if not exists public.agenda_proveedores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  nombre text not null,
  municipio text,
  rubro text,
  capacidad_mensual text,
  contacto text
);

-- ----------------------------------------------------------------------------
-- Row Level Security — un solo dueño por fila (usuario_id = auth.uid()).
-- Sin lógica de roles: no hace falta, es un solo usuario autorizado por
-- capa de aplicación (VITE_PRESIDENTE_EMAIL en AuthContext.jsx).
-- ----------------------------------------------------------------------------

alter table public.agenda_cierres enable row level security;
alter table public.agenda_despachos enable row level security;
alter table public.agenda_proveedores enable row level security;

-- agenda_cierres
drop policy if exists agenda_cierres_select on public.agenda_cierres;
create policy agenda_cierres_select on public.agenda_cierres
  for select using (usuario_id = auth.uid());

drop policy if exists agenda_cierres_insert on public.agenda_cierres;
create policy agenda_cierres_insert on public.agenda_cierres
  for insert with check (usuario_id = auth.uid());

drop policy if exists agenda_cierres_update on public.agenda_cierres;
create policy agenda_cierres_update on public.agenda_cierres
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists agenda_cierres_delete on public.agenda_cierres;
create policy agenda_cierres_delete on public.agenda_cierres
  for delete using (usuario_id = auth.uid());

-- agenda_despachos
drop policy if exists agenda_despachos_select on public.agenda_despachos;
create policy agenda_despachos_select on public.agenda_despachos
  for select using (usuario_id = auth.uid());

drop policy if exists agenda_despachos_insert on public.agenda_despachos;
create policy agenda_despachos_insert on public.agenda_despachos
  for insert with check (usuario_id = auth.uid());

drop policy if exists agenda_despachos_update on public.agenda_despachos;
create policy agenda_despachos_update on public.agenda_despachos
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists agenda_despachos_delete on public.agenda_despachos;
create policy agenda_despachos_delete on public.agenda_despachos
  for delete using (usuario_id = auth.uid());

-- agenda_proveedores
drop policy if exists agenda_proveedores_select on public.agenda_proveedores;
create policy agenda_proveedores_select on public.agenda_proveedores
  for select using (usuario_id = auth.uid());

drop policy if exists agenda_proveedores_insert on public.agenda_proveedores;
create policy agenda_proveedores_insert on public.agenda_proveedores
  for insert with check (usuario_id = auth.uid());

drop policy if exists agenda_proveedores_update on public.agenda_proveedores;
create policy agenda_proveedores_update on public.agenda_proveedores
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists agenda_proveedores_delete on public.agenda_proveedores;
create policy agenda_proveedores_delete on public.agenda_proveedores
  for delete using (usuario_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Índices — por fecha/mes, que es como la UI ordena y filtra (ver
-- computeKpis() y AgendaScreen.jsx, que ordenan cierres por `mes`).
-- ----------------------------------------------------------------------------
create index if not exists idx_agenda_cierres_usuario_mes on public.agenda_cierres (usuario_id, mes);
create index if not exists idx_agenda_despachos_usuario_fecha on public.agenda_despachos (usuario_id, fecha desc);
create index if not exists idx_agenda_proveedores_usuario_nombre on public.agenda_proveedores (usuario_id, nombre);
