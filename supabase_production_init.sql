-- ########################################################
-- SCRIPT DE INICIALIZACIÓN DE ANTIGRAVITY (PRODUCCIÓN)
-- ########################################################
-- Instrucciones: Pega todo este código en el "SQL Editor" 
-- de Supabase y presiona el botón "RUN".
-- ########################################################

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- 1. PERFILES DE USUARIO ( profiles )
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  email text not null,
  needs_setup boolean default true,
  cedula text,
  phone text,
  avatar text default '👤',
  birth_date date,
  role text default 'Colaborador',
  is_super_admin boolean default false,
  status text default 'Inactivo',
  blocked boolean default false,
  created_at timestamptz default now()
);

-- 2. GRUPOS ( groups )
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  creator_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 3. MEMBRESÍAS ( group_memberships )
create table if not exists public.group_memberships (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending', 'invited', 'approved')),
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- 4. TAREAS ( tasks )
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date not null,
  time time not null,
  user_id uuid references public.profiles(id),
  completed boolean default false,
  status text default 'accepted',
  is_shared boolean default false,
  group_ids uuid[] default '{}',
  created_by uuid references public.profiles(id),
  priority text default 'media',
  failure_reason text,
  created_at timestamptz default now()
);

-- 5. ÓRDENES DE SERVICIO ( service_orders )
create table if not exists public.service_orders (
  id text primary key, -- Se usa el formato 'OS-XXXX'
  customer_name text,
  customer_phone text,
  services text[] default '{}',
  notes text,
  responsible text,
  created_at timestamptz default now(),
  delivery_date timestamptz,
  created_by uuid references public.profiles(id),
  created_by_role text,
  status text default 'Pendiente',
  payment_status text default 'Pendiente',
  total_cost numeric default 0,
  deposit_amount numeric default 0,
  pending_balance numeric default 0,
  photos text[] default '{}',
  last_status_change_by text
);

-- 6. HISTORIAL DE ÓRDENES ( order_history )
create table if not exists public.order_history (
  id uuid primary key default uuid_generate_v4(),
  order_id text references public.service_orders(id) on delete cascade,
  timestamp timestamptz default now(),
  type text,
  user_name text,
  description text
);

-- 7. ALERTAS GLOBALES ( global_alerts )
create table if not exists public.global_alerts (
  id uuid primary key default uuid_generate_v4(),
  timestamp timestamptz default now(),
  type text,
  order_id text,
  user_id uuid,
  user_name text,
  message text,
  seen_by uuid[] default '{}'
);

-- ########################################################
-- CONFIGURACIÓN DE SEGURIDAD (RLS) INICIAL
-- ########################################################
alter table public.profiles enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.profiles;
create policy "Acceso público" on public.profiles for all using (true) with check (true);

alter table public.tasks enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.tasks;
create policy "Acceso público" on public.tasks for all using (true) with check (true);

alter table public.service_orders enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.service_orders;
create policy "Acceso público" on public.service_orders for all using (true) with check (true);

alter table public.order_history enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.order_history;
create policy "Acceso público" on public.order_history for all using (true) with check (true);

alter table public.groups enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.groups;
create policy "Acceso público" on public.groups for all using (true) with check (true);

alter table public.group_memberships enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.group_memberships;
create policy "Acceso público" on public.group_memberships for all using (true) with check (true);

alter table public.global_alerts enable row level security;
DROP POLICY IF EXISTS "Acceso público" on public.global_alerts;
create policy "Acceso público" on public.global_alerts for all using (true) with check (true);
