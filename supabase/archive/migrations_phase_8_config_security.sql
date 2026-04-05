-- ########################################################
-- MIGRACIÓN FASE 8: RESTRICCIÓN DE TABLAS DE CONFIGURACIÓN
-- ########################################################

-- 1. PROTECCIÓN DE config_service_types
-- Modos: Lectura Pública, Escritura SOLO Administradores
alter table public.config_service_types enable row level security;
drop policy if exists "Acceso público" on public.config_service_types;

drop policy if exists "Config: Lectura universal" on public.config_service_types;
create policy "Config: Lectura universal" on public.config_service_types
for select using (true);

drop policy if exists "Config: Edición exclusiva Admin" on public.config_service_types;
create policy "Config: Edición exclusiva Admin" on public.config_service_types
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- 2. PROTECCIÓN DE config_team_members
alter table public.config_team_members enable row level security;
drop policy if exists "Acceso público" on public.config_team_members;

drop policy if exists "Config: Lectura universal" on public.config_team_members;
create policy "Config: Lectura universal" on public.config_team_members
for select using (true);

drop policy if exists "Config: Edición exclusiva Admin" on public.config_team_members;
create policy "Config: Edición exclusiva Admin" on public.config_team_members
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- 3. HARDENING FINAL DE MEMBERSHIPS
-- Prevenir que usuarios no-creadores del grupo aprueben solicitudes
drop policy if exists "Memberships: Aprobación por líderes" on public.group_memberships;

drop policy if exists "Memberships: Control por líderes y Admin" on public.group_memberships;
create policy "Memberships: Control por líderes y Admin" on public.group_memberships
for update using (
  exists (
    select 1 from public.groups g
    join public.profiles p on p.id = auth.uid()
    where g.id = public.group_memberships.group_id
    and (g.creator_id = auth.uid() or p.role = 'Administrador maestro')
  )
);

-- ########################################################
-- FIN DE MIGRACIÓN FASE 8
-- ########################################################
