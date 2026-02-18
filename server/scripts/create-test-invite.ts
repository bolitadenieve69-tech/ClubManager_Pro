
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    // 1. Get or create Club
    let club = await prisma.club.findFirst();
    if (!club) {
        club = await prisma.club.create({
            data: {
                legal_name: "Test Club",
                bizum_payee: "+34 600 000 000",
                price_per_player_cents: 500,
            }
        });
    }

    // 2. Create Member
    const phone = "34612345678";
    const member = await prisma.member.upsert({
        where: { club_id_whatsapp_phone: { club_id: club.id, whatsapp_phone: phone } },
        update: {},
        create: {
            club_id: club.id,
            full_name: "Guest Tester",
            whatsapp_phone: phone,
        }
    });

    // 3. Create Invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
        data: {
            club_id: club.id,
            member_id: member.id,
            token,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        }
    });

    console.log(`\n✅ Invitation Created!`);
    console.log(`🔗 Test URL: http://localhost:5173/accept-invite?token=${token}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
