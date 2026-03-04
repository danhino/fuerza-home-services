/**
 * prisma/seed.ts
 *
 * Seeds the Fuerza Home Services database with:
 *   - 1 Admin user
 *   - 2 Technicians (with TechnicianProfile)
 *   - 2 Customers (with CustomerProfile)
 *
 * Run:  npx prisma db seed
 * Or:   npx tsx prisma/seed.ts
 */
import { PrismaClient, Role, Trade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

async function main() {
    console.log('🌱 Seeding database...');

    const hashedPw = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // ── Admin ────────────────────────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { phone: '5550000000' },
        update: {},
        create: {
            phone: '5550000000',
            email: 'admin@fuerza.dev',
            password: hashedPw,
            name: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            role: Role.ADMIN,
        },
    });
    console.log(`  ✅ Admin:       ${admin.email}  /  ${admin.phone}`);

    // ── Technician 1 ─────────────────────────────────────────────────────────
    const tech1 = await prisma.user.upsert({
        where: { phone: '5551111111' },
        update: {},
        create: {
            phone: '5551111111',
            email: 'carlos@fuerza.dev',
            password: hashedPw,
            name: 'Carlos Lopez',
            firstName: 'Carlos',
            lastName: 'Lopez',
            role: Role.TECHNICIAN,
            preferredLanguage: 'es',
            technicianProfile: {
                create: {
                    trades: [Trade.PLUMBER, Trade.ELECTRICIAN],
                    isOnline: true,
                    currentLat: 29.4241,
                    currentLng: -98.4936,
                    completedJobs: 47,
                },
            },
        },
    });
    console.log(`  ✅ Technician:  ${tech1.email}  /  ${tech1.phone}`);

    // ── Technician 2 ─────────────────────────────────────────────────────────
    const tech2 = await prisma.user.upsert({
        where: { phone: '5552222222' },
        update: {},
        create: {
            phone: '5552222222',
            email: 'maria@fuerza.dev',
            password: hashedPw,
            name: 'Maria Garcia',
            firstName: 'Maria',
            lastName: 'Garcia',
            role: Role.TECHNICIAN,
            preferredLanguage: 'es',
            technicianProfile: {
                create: {
                    trades: [Trade.CLEANING, Trade.POOL],
                    isOnline: false,
                    currentLat: 29.4500,
                    currentLng: -98.5200,
                    completedJobs: 23,
                },
            },
        },
    });
    console.log(`  ✅ Technician:  ${tech2.email}  /  ${tech2.phone}`);

    // ── Customer 1 ───────────────────────────────────────────────────────────
    const cust1 = await prisma.user.upsert({
        where: { phone: '5553333333' },
        update: {},
        create: {
            phone: '5553333333',
            email: 'john@example.com',
            password: hashedPw,
            name: 'John Smith',
            firstName: 'John',
            lastName: 'Smith',
            role: Role.CUSTOMER,
            customerProfile: {
                create: {},
            },
        },
    });
    console.log(`  ✅ Customer:    ${cust1.email}  /  ${cust1.phone}`);

    // ── Customer 2 ───────────────────────────────────────────────────────────
    const cust2 = await prisma.user.upsert({
        where: { phone: '5554444444' },
        update: {},
        create: {
            phone: '5554444444',
            email: 'ana@example.com',
            password: hashedPw,
            name: 'Ana Martinez',
            firstName: 'Ana',
            lastName: 'Martinez',
            role: Role.CUSTOMER,
            preferredLanguage: 'es',
            customerProfile: {
                create: {},
            },
        },
    });
    console.log(`  ✅ Customer:    ${cust2.email}  /  ${cust2.phone}`);

    console.log('\n🎉 Seeding complete!');
    console.log(`\n📋 Login credentials (all accounts):`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Admin:    admin@fuerza.dev  or  5550000000`);
    console.log(`   Tech 1:   carlos@fuerza.dev or  5551111111`);
    console.log(`   Tech 2:   maria@fuerza.dev  or  5552222222`);
    console.log(`   Cust 1:   john@example.com  or  5553333333`);
    console.log(`   Cust 2:   ana@example.com   or  5554444444`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
