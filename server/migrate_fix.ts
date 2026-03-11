import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database to check columns...");
        const columns: any[] = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='Booking';
        `;

        const colNames = columns.map(c => c.column_name);
        console.log("Columns found in Booking table:", colNames.join(", "));

        if (colNames.includes("expires_at") && !colNames.includes("hold_expires_at")) {
            console.log("Renaming 'expires_at' to 'hold_expires_at'...");
            await prisma.$executeRaw`ALTER TABLE "Booking" RENAME COLUMN "expires_at" TO "hold_expires_at";`;
            console.log("Renamed successfully!");
        } else if (colNames.includes("hold_expires_at")) {
            console.log("Column 'hold_expires_at' already exists. No actions taken.");
        } else {
            console.log("Neither column exists! Please investigate further.");
        }

    } catch (e: any) {
        console.error("Migration script error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
