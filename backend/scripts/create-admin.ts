import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/auth.utils';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const phone = '9999999999';
    const email = 'admin@fuerza.com';
    const password = 'admin'; // Simple password for dev
    const name = 'System Admin';

    console.log('Creating Admin User...');

    // Check if exists
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] }
    });

    if (existing) {
        console.log('Admin user already exists.');
        if (existing.role !== Role.ADMIN) {
            console.log('Updating role to ADMIN...');
            await prisma.user.update({
                where: { id: existing.id },
                data: { role: Role.ADMIN }
            });
            console.log('Role updated.');
        }
        return;
    }

    const output = await hashPassword(password);

    await prisma.user.create({
        data: {
            name,
            email,
            phone,
            password: output,
            role: Role.ADMIN,
        },
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@fuerza.com');
    console.log('Phone: 9999999999');
    console.log('Password: admin');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
