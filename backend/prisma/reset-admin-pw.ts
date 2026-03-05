/**
 * Reset admin password.
 * Run: npx tsx prisma/reset-admin-pw.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@fuerza.com';
    const newPassword = 'admin123';
    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.updateMany({
        where: { email },
        data: { password: hashed },
    });

    if (user.count === 0) {
        console.log('❌ No admin user found with email:', email);
    } else {
        console.log('✅ Admin password reset!');
        console.log('   Email:', email);
        console.log('   Password:', newPassword);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
