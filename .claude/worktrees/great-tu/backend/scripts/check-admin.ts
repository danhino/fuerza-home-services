import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../src/utils/auth.utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@fuerza.com' },
    });

    if (!user) {
        console.log('ERROR: No admin user found in the database!');
        return;
    }

    console.log('Admin user found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Password hash:', user.password);
    console.log('  Hash length:', user.password.length);

    const match = await comparePassword('admin', user.password);
    console.log('  Password "admin" matches:', match);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
