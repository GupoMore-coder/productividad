-- ########################################################
-- MIGRACIÓN FASE 2: AUTOMATIZACIÓN E INTEGRIDAD DE DATOS
-- ########################################################

-- 1. Tablas de Configuración (Maestros)
create table if not exists public.config_service_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.config_team_members (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null unique,
  role text,
  created_at timestamptz default now()
);

-- Insertar valores iniciales (basados en el código actual)
insert into public.config_service_types (name) values 
('Sublimado de camisetas'), ('DTF'), ('Vinilo adhesivo'), 
('UV DTF'), ('Vinilo textil'), ('Sublimación de tazas'), 
('Bordado'), ('Otros')
on conflict (name) do nothing;

insert into public.config_team_members (full_name) values 
('Shaira Mendez'), ('Nayelis Puerta'), ('Maidi Sarmiento'), 
('Fernando Marulanda'), ('Florangellys Vilarete'), ('Miguel A Marulanda')
on conflict (full_name) do nothing;

-- 2. Sistema de Generación de ID de Orden Automático
-- Crear secuencia para el contador
create sequence if not exists public.order_number_seq start 1;

-- Función para generar el ID con formato ORDEN XXXXXX
create or replace function public.generate_order_id()
returns trigger as $$
begin
  if new.id is null or new.id = '' then
    new.id := 'ORDEN ' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

-- Aplicar el trigger a la tabla service_orders
drop trigger if exists tr_generate_order_id on public.service_orders;
create trigger tr_generate_order_id
before insert on public.service_orders
for each row execute function public.generate_order_id();

-- 3. Columnas faltantes y auditoría
alter table public.service_orders add column if not exists completed_at timestamptz;

-- 4. RLS para nuevas tablas (Se dejan abiertas según instrucción del usuario)
alter table public.config_service_types enable row level security;
create policy "Acceso público" on public.config_service_types for all using (true) with check (true);

alter table public.config_team_members enable row level security;
create policy "Acceso público" on public.config_team_members for all using (true) with check (true);
