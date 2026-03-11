
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    try {
        const club = await prisma.club.findFirst();
        if (!club) {
            console.log("No clubs found");
            return;
        }
        console.log(`Diagnosing for club: ${club.id} (${club.display_name})`);

        const startDate = new Date(2026, 1, 1);
        const endDate = new Date(2026, 1, 28);

        console.log("Fetching Invoices...");
        const incomes = await prisma.invoice.findMany({
            where: { club_id: club.id, created_at: { gte: startDate, lte: endDate } }
        });
        console.log(`Found ${incomes.length} invoices`);

        console.log("Fetching Supplier Invoices...");
        const expenses = await prisma.supplierInvoice.findMany({
            where: { club_id: club.id, date: { gte: startDate, lte: endDate } }
        });
        console.log(`Found ${expenses.length} supplier invoices`);

        console.log("Fetching Internal Movements...");
        const internalMovements = await prisma.movement.findMany({
            where: { club_id: club.id, date: { gte: startDate, lte: endDate } }
        });
        console.log(`Found ${internalMovements.length} internal movements`);

        console.log("Fetching Bookings...");
        const confirmedBookings = await prisma.booking.findMany({
            where: { club_id: club.id, start_at: { gte: startDate, lte: endDate } }
        });
        console.log(`Found ${confirmedBookings.length} bookings`);

        console.log("✅ Diagnostics passed without crash");
    } catch (err) {
        console.error("❌ Diagnostic failed:");
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
