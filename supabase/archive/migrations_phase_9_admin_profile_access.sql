-- ########################################################
-- MIGRACIÓN FASE 9: GESTIÓN DE PERFILES POR ADMINISTRADOR
-- ########################################################

-- 1. Permitir que los Administradores Maestros editen CUALQUIER perfil
-- Esto es necesario para que el panel de AdminUsers pueda cambiar roles.

drop policy if exists "Perfiles: Edición segura" on public.profiles;

-- Política combinada: 
-- 1. El usuario puede editar su propio perfil (sin cambiar su propio rol a menos que sea Admin).
-- 2. El Administrador Maestro puede editar CUALQUIER perfil sin restricciones.

create policy "Perfiles: Gestión Administrativa" on public.profiles
for update using (
  id = auth.uid() 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'Administrador maestro'
  )
)
with check (
  id = auth.uid() 
  or exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'Administrador maestro'
  )
);

-- ########################################################
-- FIN DE MIGRACIÓN FASE 9
-- ########################################################
