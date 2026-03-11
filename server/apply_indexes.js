import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log("Connected to pooler.");

        console.log("Applying index to TournamentParticipant...");
        await client.query('CREATE INDEX IF NOT EXISTS "TournamentParticipant_tournament_id_idx" ON "TournamentParticipant"("tournament_id")');

        console.log("Applying index to TournamentMatch...");
        await client.query('CREATE INDEX IF NOT EXISTS "TournamentMatch_tournament_id_idx" ON "TournamentMatch"("tournament_id")');

        console.log("✅ Indexes applied successfully!");
    } catch (err) {
        console.error("❌ Failed to apply indexes:", err.message);
    } finally {
        await client.end();
    }
}

run();
