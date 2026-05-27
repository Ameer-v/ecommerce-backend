import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Security: Admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for seeding');
  }

  // Buat role Admin
  const role = await prisma.role.create({
    data: { name: 'Admin', description: 'Administrator' },
  });

  // Hash password
  const hash = await bcrypt.hash(adminPassword, 10);

  // Buat user Admin
  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash: hash,
      address: 'Indonesia',
      phone: '000000000000',
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