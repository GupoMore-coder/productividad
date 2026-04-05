-- ########################################################
-- MIGRACIÓN FASE 5: SEGURIDAD AVANZADA Y PERMISOS ROBUSTOS
-- ########################################################

-- 1. Asegurar que la columna 'role' y 'bypass_allowed' existen
-- Usamos un bloque anónimo para evitar errores si la columna ya existe
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') then
    alter table public.profiles add column role text default 'Colaborador';
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='bypass_allowed') then
    alter table public.profiles add column bypass_allowed boolean default true;
  end if;
end $$;

-- 2. Limpieza de Políticas Anteriores (Evita duplicados)
drop policy if exists "Acceso público" on public.profiles;
drop policy if exists "Acceso público" on public.tasks;
drop policy if exists "Acceso público" on public.service_orders;
drop policy if exists "Acceso público" on public.order_history;
drop policy if exists "Acceso público" on public.config_service_types;
drop policy if exists "Acceso público" on public.config_team_members;
drop policy if exists "Acceso público" on public.global_alerts;

-- 3. Políticas Granulares para PERFILES
create policy "Perfiles: Lectura total" on public.profiles
for select using ( auth.role() = 'authenticated' );

create policy "Perfiles: Edición propia" on public.profiles
for update using ( auth.uid() = id ) with check ( auth.uid() = id );

-- 4. Políticas para ÓRDENES DE SERVICIO
create policy "Órdenes: Lectura total" on public.service_orders
for select using ( auth.role() = 'authenticated' );

create policy "Órdenes: Gestión total" on public.service_orders
for all using ( auth.role() = 'authenticated' );

-- 5. Políticas para CONFIGURACIÓN (TABLAS MAESTRAS)
-- Cualquier usuario autenticado puede leer para los selects del formulario
create policy "Config: Lectura total" on public.config_service_types for select using (true);
create policy "Config: Lectura total" on public.config_team_members for select using (true);

-- SOLO el Administrador Maestro o Super Admin puede gestionar configuración
create policy "Config: Gestión Maestro Service Types" on public.config_service_types
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and (role = 'Administrador maestro' or is_super_admin = true)
  )
);

create policy "Config: Gestión Maestro Team Members" on public.config_team_members
for all using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and (role = 'Administrador maestro' or is_super_admin = true)
  )
);

-- 6. TAREAS Y AGENDA
create policy "Tareas: Gestión personal" on public.tasks
for all using ( auth.uid() = user_id or auth.uid() = created_by );

-- 7. ALERTAS GLOBALES
create policy "Alertas: Lectura" on public.global_alerts for select using (true);
create policy "Alertas: Inserción" on public.global_alerts for insert with check (auth.role() = 'authenticated');
