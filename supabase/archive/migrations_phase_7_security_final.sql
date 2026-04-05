-- ########################################################
-- MIGRACIÓN FASE 7: SEGURIDAD FINAL Y HARDENING RLS
-- ########################################################

-- 1. REFINAMIENTO DE ÓRDENES (service_orders)
-- El Colaborador puede editar (UPDATE) SOLO sus órdenes.
-- El Colaborador NO PUEDE borrar (DELETE) órdenes (Incluso si las creó).
-- Solo los Administradores tienen permiso de DELETE.

drop policy if exists "Órdenes: Edición restrictiva" on public.service_orders;
drop policy if exists "Órdenes: Eliminación restrictiva" on public.service_orders;

-- Política de UPDATE: Creador o Admin
create policy "Órdenes: Edición v2" on public.service_orders
for update using (
  auth.uid() = created_by 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- Política de DELETE: SOLO ADMINS (Previene borrado por malicia/error de colaboradores)
create policy "Órdenes: Borrado exclusivo Admin" on public.service_orders
for delete using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Administrador maestro', 'Administrador')
  )
);

-- 2. PROTECCIÓN DE PERFILES (profiles)
-- Prevenir mass assignment o edición de roles por usuarios no administradores
drop policy if exists "Perfiles: Edición personal" on public.profiles;

create policy "Perfiles: Edición segura" on public.profiles
for update using ( id = auth.uid() )
with check (
  id = auth.uid() 
  -- Impedir que un usuario no-admin cambie su propio rol a Administrador
  and (
    (select role from public.profiles where id = auth.uid()) = role -- El rol no cambia
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'Administrador maestro'
    )
  )
);

-- 3. AUDITORÍA SSRF Y EDGE FUNCTIONS (Info)
-- Nota: La validación de permisos en Edge Functions debe hacerse mediante 
-- el paso del JWT del usuario y usando `auth.uid()` dentro de la función 
-- en lugar de confiar ciegamente en IDs pasados por parámetros.

-- ########################################################
-- FIN DE MIGRACIÓN FASE 7
-- ########################################################
