-- Ejecutar como administrador de PostgreSQL si no se utiliza Docker Compose.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cecasem_ticket_user') THEN
    CREATE ROLE cecasem_ticket_user LOGIN PASSWORD 'CAMBIAR_PASSWORD';
  END IF;
END
$$;

SELECT 'CREATE DATABASE cecasem_tickets OWNER cecasem_ticket_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cecasem_tickets')\gexec

