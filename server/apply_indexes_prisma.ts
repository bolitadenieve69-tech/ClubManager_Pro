import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Applying index to TournamentParticipant...");
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TournamentParticipant_tournament_id_idx" ON "TournamentParticipant"("tournament_id")');

    console.log("Applying index to TournamentMatch...");
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TournamentMatch_tournament_id_idx" ON "TournamentMatch"("tournament_id")');

    console.log("✅ Indexes applied successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Failed to apply indexes:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
