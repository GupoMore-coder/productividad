-- 20260415_add_new_services.sql
-- Agrega nuevos servicios técnicos al catálogo de la aplicación.

INSERT INTO public.config_service_types (name)
VALUES 
    ('Marcado laser'),
    ('Sublimacion placa mascota')
ON CONFLICT (name) DO NOTHING;
