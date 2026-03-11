import { prisma } from "../db/prisma.js";

export function startExpirationJob() {
    console.log("🕒 Starting Booking Expiration Job (every 1 min)");

    setInterval(async () => {
        try {
            const now = new Date();

            // Query 1: Expire PENDING_PAYMENT bookings
            const expiredPending = await prisma.booking.updateMany({
                where: {
                    status: "PENDING_PAYMENT",
                    hold_expires_at: { lt: now }
                },
                data: { status: "EXPIRED" }
            });

            // Query 2: Expire HOLD bookings
            const expiredHold = await prisma.booking.updateMany({
                where: {
                    status: "HOLD",
                    hold_expires_at: { lt: now }
                },
                data: { status: "EXPIRED" }
            });

            const total = expiredPending.count + expiredHold.count;
            if (total > 0) {
                console.log(`🧹 Expired ${total} bookings (${expiredPending.count} PENDING_PAYMENT + ${expiredHold.count} HOLD)`);
            }
        } catch (error: any) {
            console.error("❌ Error in Expiration Job:", error?.message || error);
        }
    }, 60 * 1000);
}
