
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Diagnostic Tool ---');
    console.log('Checking connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Connection successful. Total users: ${userCount}`);

        console.log('\n--- Users & Roles ---');
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, club_id: true, full_name: true }
        });
        console.table(users);

        const admins = users.filter(u => u.role === 'ADMIN');
        if (admins.length === 0) {
            console.warn('⚠️  WARNING: No users with ADMIN role found! Accounting module will be inaccessible.');
        } else {
            console.log(`✅ Found ${admins.length} ADMIN user(s).`);
        }

        console.log('\n--- Tournaments ---');
        const tournaments = await prisma.tournament.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { _count: { select: { participants: true, matches: true } } }
        });
        console.table(tournaments);

        if (tournaments.length === 0) {
            console.log('ℹ️  No tournaments found.');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
