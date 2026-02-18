import { prisma } from "../db/prisma.js";

export function startExpirationJob() {
    console.log("🕒 Starting Booking Expiration Job (every 1 min)");

    setInterval(async () => {
        try {
            const now = new Date();
            const expiredBookings = await prisma.booking.findMany({
                where: {
                    status: "PENDING_PAYMENT",
                    expires_at: { lt: now }
                }
            });

            if (expiredBookings.length > 0) {
                console.log(`🧹 Expiring ${expiredBookings.length} bookings...`);
                await prisma.booking.updateMany({
                    where: {
                        id: { in: expiredBookings.map(b => b.id) }
                    },
                    data: { status: "EXPIRED" }
                });
            }
        } catch (error) {
            console.error("❌ Error in Expiration Job:", error);
        }
    }, 60 * 1000);
}
