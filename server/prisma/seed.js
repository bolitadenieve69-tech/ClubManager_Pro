import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create a Club
    const club = await prisma.club.upsert({
        where: { id: 'default-club-id' },
        update: {},
        create: {
            id: 'default-club-id',
            legal_name: 'Club Shakti Pro',
            tax_id: 'B12345678',
            fiscal_address: 'Calle Ficticia 123, Madrid',
            default_vat: 21,
            currency: 'EUR',
            invoice_prefix: 'CS',
            invoice_counter: 1,
            default_hourly_rate: 2000,
            segment_minutes: 60,
        },
    });

    console.log('✅ Club created:', club.legal_name);

    // 2. Create an Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@shakti.pro' },
        update: {},
        create: {
            email: 'admin@shakti.pro',
            password_hash: passwordHash,
            club_id: club.id,
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin user created:', user.email);

    // 3. Create some Courts
    await prisma.court.createMany({
        data: [
            { name: 'Pista 1 - Cristal', club_id: club.id, surface_type: 'Cristal', lighting: true },
            { name: 'Pista 2 - Cristal', club_id: club.id, surface_type: 'Cristal', lighting: true },
            { name: 'Pista 3 - Muro', club_id: club.id, surface_type: 'Muro', lighting: false },
        ],
    });

    console.log('✅ Courts created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
