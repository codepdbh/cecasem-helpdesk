-- Datos de catalogo opcionales. Las cuentas iniciales se crean mediante `npx prisma db seed`
-- para garantizar que las contrasenas se almacenen con hash bcrypt.
INSERT INTO "Category" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Soporte técnico', true, now(), now()),
  (gen_random_uuid(), 'Internet y red', true, now(), now()),
  (gen_random_uuid(), 'Equipos de computación', true, now(), now()),
  (gen_random_uuid(), 'Impresoras', true, now(), now()),
  (gen_random_uuid(), 'Sistemas internos', true, now(), now()),
  (gen_random_uuid(), 'Correos institucionales', true, now(), now()),
  (gen_random_uuid(), 'Solicitudes administrativas', true, now(), now()),
  (gen_random_uuid(), 'Mantenimiento', true, now(), now()),
  (gen_random_uuid(), 'Capacitación', true, now(), now()),
  (gen_random_uuid(), 'Otros', true, now(), now())
ON CONFLICT ("name") DO NOTHING;
