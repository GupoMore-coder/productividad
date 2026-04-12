-- Consulta para ver qué extensiones relacionadas con red están disponibles
SELECT name, default_version, installed_version, comment 
FROM pg_available_extensions 
WHERE name LIKE '%net%' OR name LIKE '%http%';
