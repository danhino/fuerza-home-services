import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Fuerza Home Services User Stats ---');

    // 1. Total Users
    const totalUsers = await prisma.user.count();
    console.log(`Total Registered Users: ${totalUsers}`);

    // 2. Users by Role
    const technicians = await prisma.user.count({ where: { role: Role.TECHNICIAN } });
    const customers = await prisma.user.count({ where: { role: Role.CUSTOMER } });

    console.log(`- Technicians: ${technicians}`);
    console.log(`- Customers: ${customers}`);

    // 3. Online Technicians
    const onlineTechnicians = await prisma.technicianProfile.count({
        where: { isOnline: true }
    });
    console.log(`- Online Technicians: ${onlineTechnicians}`);

    // 4. (Approximate) Active Customers? 
    // We don't have a "logged in" field for customers, but we could check recently created jobs?
    // For now, we'll just stick to registration counts.

    console.log('---------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
