
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Intentar cargar .env
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { }

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Repair & Check Tool ---');
    try {
        // 1. REPAIR SECTION
        console.log('1. Checking/Repairing missing tables...');

        // Create TournamentParticipant
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TournamentParticipant" (
        "id" TEXT NOT NULL,
        "tournament_id" TEXT NOT NULL,
        "user_id" TEXT,
        "name" TEXT,
        "total_points" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
      );
    `);

        // Create TournamentMatch (just in case)
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TournamentMatch" (
        "id" TEXT NOT NULL,
        "tournament_id" TEXT NOT NULL,
        "round" INTEGER NOT NULL,
        "court_id" TEXT,
        "player1_id" TEXT NOT NULL,
        "player2_id" TEXT NOT NULL,
        "player3_id" TEXT NOT NULL,
        "player4_id" TEXT NOT NULL,
        "score_12" INTEGER,
        "score_34" INTEGER,
        CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
      );
    `);

        console.log('✅ Base tables ensured.');

        // Add Indices/FKs (Best effort, ignore if exist)
        const runSql = async (sql) => { try { await prisma.$executeRawUnsafe(sql); } catch (e) { } };

        await runSql(`CREATE UNIQUE INDEX "TournamentParticipant_tournament_id_user_id_key" ON "TournamentParticipant"("tournament_id", "user_id")`);
        await runSql(`ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await runSql(`ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await runSql(`ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        console.log('✅ Schema repair commands finished.');

        // 2. DIAGNOSTIC SECTION
        console.log('\n2. Verifying application data...');
        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);

        const tournaments = await prisma.tournament.findMany({
            take: 5,
            include: {
                _count: { select: { participants: true, matches: true } },
                participants: { take: 1 },
                matches: { take: 1 }
            }
        });

        if (tournaments.length === 0) {
            console.log('ℹ️  No tournaments found (but query worked!).');
        } else {
            console.log(`✅ Loaded ${tournaments.length} tournaments successfully.`);
            console.log('Sample Data Validated: OK');
        }

        console.log('\n✨ SYSTEM STATUS: READY TO START ✨');
        console.log('You can now run: npm run dev');

    } catch (error) {
        console.error('❌ Error during repair/check:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
