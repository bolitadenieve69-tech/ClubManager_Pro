
const { PrismaClient } = require('@prisma/client');
const path = require('path');
// Try to load dotenv, handle if missing
try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
    console.log("Could not load dotenv, assuming env vars are set or not needed if connection string is default");
}

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Diagnostic (CommonJS) ---');
    try {
        console.log('Attempting to connect to DB...');
        // Force connection to test
        await prisma.$connect();
        console.log('✅ Connected.');

        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);

        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, club_id: true, full_name: true }
        });
        console.log('\n--- Users ---');
        console.log(JSON.stringify(users, null, 2));

        const admins = users.filter(u => u.role === 'ADMIN');
        if (admins.length === 0) {
            console.error('\n❌ CRITICAL: No ADMIN users found!');
        } else {
            console.log(`\n✅ Found ${admins.length} ADMINs.`);
        }

        const tournaments = await prisma.tournament.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { _count: { select: { participants: true, matches: true } } }
        });
        console.log('\n--- Tournaments ---');
        console.log(JSON.stringify(tournaments, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
