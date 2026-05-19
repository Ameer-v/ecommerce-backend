import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Buat role Admin
  const role = await prisma.role.create({
    data: { name: 'Admin', description: 'Administrator' },
  });

  // Hash password
  const hash = await bcrypt.hash('admin123', 10);

  // Buat user Admin
  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@ukl.com',
      passwordHash: hash,
      address: 'Malang',
      phone: '081111111111',
      roleId: role.id,
    },
  });

  console.log('Admin created:', user.email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });