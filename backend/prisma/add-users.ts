/**
 * Add new customer and technician users
 * Run: npx tsx prisma/add-users.ts
 */
import { PrismaClient, Role, Trade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const SALT_ROUNDS = 10;

    // Customer
    const customerEmail = 'juju@gmail.com';
    const customerPassword = 'pass123';
    const customerPhone = '5555555555';

    // Technician
    const techEmail = 'juantech@gmail.com';
    const techPassword = 'pass123';
    const techPhone = '5556666666';

    const hashedPassword = await bcrypt.hash(customerPassword, SALT_ROUNDS);

    console.log('🌱 Adding new users...');

    // Add Customer
    try {
        const customer = await prisma.user.upsert({
            where: { phone: customerPhone },
            update: {},
            create: {
                phone: customerPhone,
                email: customerEmail,
                password: hashedPassword,
                name: 'Juju Customer',
                firstName: 'Juju',
                lastName: 'Customer',
                role: Role.CUSTOMER,
                customerProfile: {
                    create: {},
                },
            },
        });
        console.log(`  ✅ Customer:  ${customer.email} / ${customer.phone}`);
    } catch (error) {
        console.error('  ❌ Error creating customer:', error);
    }

    // Add Technician
    try {
        const technician = await prisma.user.upsert({
            where: { phone: techPhone },
            update: {},
            create: {
                phone: techPhone,
                email: techEmail,
                password: hashedPassword,
                name: 'Juan Technician',
                firstName: 'Juan',
                lastName: 'Technician',
                role: Role.TECHNICIAN,
                technicianProfile: {
                    create: {
                        trades: [Trade.PLUMBER, Trade.ELECTRICIAN],
                        isOnline: true,
                    },
                },
            },
        });
        console.log(`  ✅ Technician: ${technician.email} / ${technician.phone}`);
    } catch (error) {
        console.error('  ❌ Error creating technician:', error);
    }

    console.log('\n🎉 Users added!');
    console.log(`\n📋 New login credentials:`);
    console.log(`   Customer:    juju@gmail.com    / pass123`);
    console.log(`   Technician:  juantech@gmail.com / pass123`);
}

main()
    .catch((e) => {
        console.error('❌ Failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
