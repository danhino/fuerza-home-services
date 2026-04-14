/**
 * Seed an admin user for the web admin console.
 * Run: npx tsx prisma/seed-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@fuerza.com';
    const password = 'admin123';

    // Check if admin already exists
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { role: 'ADMIN' }] },
    });

    if (existing) {
        console.log('✅ Admin user already exists:', existing.email, '| role:', existing.role);
        return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
        data: {
            email,
            phone: '+10000000000',
            password: hashed,
            name: 'Admin',
            firstName: 'Fuerza',
            lastName: 'Admin',
            role: 'ADMIN',
        },
    });

    console.log('🎉 Admin user created!');
    console.log('   Email:', admin.email);
    console.log('   Password:', password);
    console.log('   Role:', admin.role);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
