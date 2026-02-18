import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database for Bizum App...');

    // 1. Create a Club with Bizum Config
    const club = await prisma.club.upsert({
        where: { id: 'default-club-id' },
        update: {},
        create: {
            id: 'default-club-id',
            legal_name: 'Club Padel Pro',
            tax_id: 'B12345678',
            fiscal_address: 'Av. del Deporte 1, Padel City',
            currency: 'EUR',
            invoice_prefix: 'CP',

            // Bizum / Config
            phone_whatsapp: '+34600123456',
            bizum_payee: '+34600123456',
            price_per_player_cents: 500, // 5€
            slot_minutes: 90,           // 1h30m
            buffer_minutes: 0,
            min_advance_minutes: 60,
            max_advance_days: 14,
            open_hours: JSON.stringify({
                "1": { open: "08:00", close: "23:00" },
                "2": { open: "08:00", close: "23:00" },
                "3": { open: "08:00", close: "23:00" },
                "4": { open: "08:00", close: "23:00" },
                "5": { open: "08:00", close: "23:00" },
                "6": { open: "09:00", close: "22:00" },
                "0": { open: "09:00", close: "21:00" }
            }),
        },
    });

    console.log('✅ Club created/updated:', club.legal_name);

    // 2. Create an Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@padel.pro' },
        update: {},
        create: {
            email: 'admin@padel.pro',
            password_hash: passwordHash,
            club_id: club.id,
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin user created:', admin.email);

    // 3. Create Courts (Mínimo 2)
    const count = await prisma.court.count({ where: { club_id: club.id } });
    if (count === 0) {
        await prisma.court.createMany({
            data: [
                { name: 'Pista Central (Cristal)', club_id: club.id, lighting: true },
                { name: 'Pista 2 (Muro)', club_id: club.id, lighting: false },
            ],
        });
        console.log('✅ Courts created');
    }

    // 4. Create a test Member
    const testMember = await prisma.member.upsert({
        where: { club_id_whatsapp_phone: { club_id: club.id, whatsapp_phone: '+34699000111' } },
        update: {},
        create: {
            club_id: club.id,
            full_name: 'Juan Amigo Padel',
            whatsapp_phone: '+34699000111',
            status: 'APPROVED'
        }
    });
    console.log('✅ Test member created:', testMember.full_name);

    // 5. Create a test Invitation
    const invitation = await prisma.invitation.upsert({
        where: { token: 'test-token-123' },
        update: {},
        create: {
            club_id: club.id,
            token: 'test-token-123',
            member_id: testMember.id,
            status: 'PENDING',
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
        }
    });

    console.log('✅ Test invitation created: token=test-token-123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
