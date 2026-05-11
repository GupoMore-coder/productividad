-- MIGRACION 2 DE 3 - PWA OPTIMIZATION
-- Agrega columnas y tablas faltantes
-- Fecha: 10/05/2026

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'schedule_datetime') THEN
        ALTER TABLE public.tasks ADD COLUMN schedule_datetime TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'push_1h_sent') THEN
        ALTER TABLE public.tasks ADD COLUMN push_1h_sent BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'is_muted') THEN
        ALTER TABLE public.tasks ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'image_urls') THEN
        ALTER TABLE public.tasks ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'service_orders' AND column_name = 'pdf_url') THEN
        ALTER TABLE public.service_orders ADD COLUMN pdf_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'service_orders' AND column_name = 'pdf_expires_at') THEN
        ALTER TABLE public.service_orders ADD COLUMN pdf_expires_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'service_orders' AND column_name = 'quote_expires_at') THEN
        ALTER TABLE public.service_orders ADD COLUMN quote_expires_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMPTZ;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.missing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT,
    item_name TEXT NOT NULL,
    description TEXT,
    reported_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    social_links TEXT[] DEFAULT '{}',
    secondary_contact TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    unit_price NUMERIC(12,2) DEFAULT 0,
    provider_id UUID,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT,
    device_type TEXT,
    counter INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_orders_delivery_date ON public.service_orders (delivery_date);
CREATE INDEX IF NOT EXISTS idx_service_orders_record_type ON public.service_orders (record_type);
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_status ON public.service_orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks (completed);
CREATE INDEX IF NOT EXISTS idx_tasks_schedule_datetime ON public.tasks (schedule_datetime) WHERE schedule_datetime IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups (creator_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON public.group_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships (group_id);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserCredentials policy" ON public.user_credentials;
CREATE POLICY "UserCredentials policy" ON public.user_credentials FOR ALL TO authenticated USING (user_id = auth.uid());