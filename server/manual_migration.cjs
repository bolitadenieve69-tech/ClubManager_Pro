
console.log('1. Script initiated');
try {
    const { PrismaClient } = require('@prisma/client');
    const path = require('path');
    console.log('2. Modules required');

    try {
        require('dotenv').config({ path: path.join(__dirname, '.env') });
        console.log('3. Dotenv loaded');
    } catch (e) {
        console.log('3. Dotenv failed (might be fine if env vars exist)');
    }

    const prisma = new PrismaClient();
    console.log('4. Prisma client instantiated');

    async function main() {
        console.log('5. Connecting to DB...');
        await prisma.$connect();
        console.log('✅ Connected. Applying patch...');

        const sql = `
            CREATE TABLE IF NOT EXISTS "TournamentParticipant" (
                "id" TEXT NOT NULL,
                "tournament_id" TEXT NOT NULL,
                "user_id" TEXT,
                "name" TEXT,
                "total_points" INTEGER NOT NULL DEFAULT 0,
                CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
            );
        `;

        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Table created.');

        try {
            await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "TournamentParticipant_tournament_id_user_id_key" ON "TournamentParticipant"("tournament_id", "user_id");`);
            console.log('✅ Index created.');
        } catch (e) { console.log('ℹ️ Index skipped/exists.'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
            console.log('✅ FK user created.');
        } catch (e) { console.log('ℹ️ FK user skipped.'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
            console.log('✅ FK tournament created.');
        } catch (e) { console.log('ℹ️ FK tournament skipped.'); }

        console.log('🎉 MIGRATION SUCCESSFUL! You can now start the app.');
    }

    main()
        .catch(e => {
            console.error('❌ FATAL ERROR:', e);
        })
        .finally(async () => {
            await prisma.$disconnect();
            console.log('7. Disconnected');
            process.exit(0);
        });

} catch (e) {
    console.error('❌ CRITICAL STARTUP ERROR:', e);
}
