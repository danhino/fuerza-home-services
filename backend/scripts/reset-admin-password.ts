import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth.utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const hashed = await hashPassword('admin');
    const result = await prisma.user.updateMany({
        where: { email: 'admin@fuerza.com' },
        data: { password: hashed },
    });
    console.log(`Updated ${result.count} user(s). Admin password reset to 'admin'.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
