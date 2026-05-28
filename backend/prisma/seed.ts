import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  'Soporte técnico',
  'Internet y red',
  'Equipos de computación',
  'Impresoras',
  'Sistemas internos',
  'Correos institucionales',
  'Solicitudes administrativas',
  'Mantenimiento',
  'Capacitación',
  'Otros',
];

const administrators = [
  { firstName: 'Paulo', username: 'paulo', password: 'Paulo.123' },
  { firstName: 'Alfredo', username: 'alfredo', password: 'Alfredo.123' },
  { firstName: 'Diego', username: 'diego', password: 'Diego.123' },
];

async function main(): Promise<void> {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const administrator of administrators) {
    const passwordHash = await bcrypt.hash(administrator.password, 12);
    await prisma.user.upsert({
      where: { username: administrator.username },
      update: {
        firstName: administrator.firstName,
        lastName: 'Equipo de Sistemas',
        fullName: `${administrator.firstName} Equipo de Sistemas`,
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isActive: true,
        mustChangePassword: true,
        passwordHash,
      },
      create: {
        firstName: administrator.firstName,
        lastName: 'Equipo de Sistemas',
        fullName: `${administrator.firstName} Equipo de Sistemas`,
        username: administrator.username,
        passwordHash,
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isActive: true,
        mustChangePassword: true,
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: 'REQUIRE_USER_APPROVAL' },
    update: {},
    create: { key: 'REQUIRE_USER_APPROVAL', value: 'true' },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
