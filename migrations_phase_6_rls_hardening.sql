-- ########################################################
-- MIGRACIÓN FASE 6: ENDURECIMIENTO DE RLS (HARDENING)
-- ########################################################

-- 1. Limpieza de políticas laxas anteriores
drop policy if exists "Órdenes: Lectura total" on public.service_orders;
drop policy if exists "Órdenes: Gestión total" on public.service_orders;
drop policy if exists "Tareas: Gestión personal" on public.tasks;
drop policy if exists "Acceso público" on public.order_history;

-- 2. TALLER DE ÓRDENES (service_orders)
-- Lectura: Todos los miembros del equipo pueden ver las órdenes para colaborar
create policy "Órdenes: Lectura equipo" on public.service_orders
for select using ( auth.role() = 'authenticated' );

-- Inserción: Cualquier miembro puede crear una orden
create policy "Órdenes: Creación equipo" on public.service_orders
for insert with check ( auth.role() = 'authenticated' );

-- Edición: Solo el creador de la orden o un Administrador pueden modificarla
create policy "Órdenes: Edición restrictiva" on public.service_orders
for update using (
  auth.uid() = created_by 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
) with check (
  auth.uid() = created_by 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- Eliminación: Solo Administradores o Creador
create policy "Órdenes: Eliminación restrictiva" on public.service_orders
for delete using (
  auth.uid() = created_by 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- 3. AGENDA Y TAREAS (tasks)
-- Gestión personal: El dueño de la tarea o quien la creó tiene control total
create policy "Tareas: Gestión personal avanzada" on public.tasks
for all using (
  auth.uid() = user_id 
  or auth.uid() = created_by
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- 4. HISTORIAL DE ÓRDENES (order_history) - INMUTABLE
-- El historial no se debe poder editar ni borrar una vez creado
create policy "Historial: Lectura equipo" on public.order_history
for select using ( auth.role() = 'authenticated' );

create policy "Historial: Inserción sistema" on public.order_history
for insert with check ( auth.role() = 'authenticated' );

-- No se crean políticas de UPDATE ni DELETE para order_history por diseño inmutable.
