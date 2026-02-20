import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addMinutes, format, parseISO, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";

export const occupancyRouter = Router();

// GET Availability for a specific date and court
occupancyRouter.get(
    "/availability",
    asyncHandler(async (req, res) => {
        const { clubId, date, courtId } = z.object({
            clubId: z.string().uuid(),
            date: z.string(), // YYYY-MM-DD
            courtId: z.string().uuid().optional()
        }).parse(req.query);

        const club = await prisma.club.findUnique({ where: { id: clubId } });
        if (!club) throw new Error("Club not found");

        const targetDate = parseISO(date);
        const dayOfWeek = targetDate.getDay(); // 0-6 (Dom-Sab)
        const openHours = JSON.parse(club.open_hours);
        const config = openHours[dayOfWeek];

        if (!config) return res.json({ slots: [] });

        const [startH, startM] = config.open.split(":").map(Number);
        const [endH, endM] = config.close.split(":").map(Number);

        let current = new Date(targetDate);
        current.setHours(startH, startM, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(endH, endM, 0, 0);

        // Fetch all occupancy for this day
        const occupancy = await getOccupancy(clubId, targetDate, courtId);

        const slots = [];
        while (isBefore(current, dayEnd)) {
            const slotEnd = addMinutes(current, club.slot_minutes);
            if (isAfter(slotEnd, dayEnd)) break;

            const isOccupied = occupancy.some(occ =>
                (occ.court_id === courtId || !courtId) &&
                isOverlapping(current, slotEnd, occ.start_at, occ.end_at)
            );

            // Additional constraints: minAdvanceMinutes
            const now = new Date();
            const minTime = addMinutes(now, club.min_advance_minutes);
            const isTooSoon = isBefore(current, minTime);

            slots.push({
                start: current.toISOString(),
                end: slotEnd.toISOString(),
                available: !isOccupied && !isTooSoon,
                reason: isOccupied ? "OCCUPIED" : (isTooSoon ? "TOO_SOON" : null)
            });

            current = addMinutes(current, club.slot_minutes);
        }

        res.json({ slots });
    })
);

// GET Unified Occupancy for Admin Quadrant
occupancyRouter.get(
    "/daily",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { date } = z.object({ date: z.string() }).parse(req.query);
        const targetDate = parseISO(date);

        const occupancy = await getOccupancy(clubId!, targetDate);
        res.json({ occupancy });
    })
);

async function getOccupancy(clubId: string, date: Date, courtId?: string) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const where: any = {
        club_id: clubId,
        start_at: { gte: dayStart },
        end_at: { lte: dayEnd }
    };
    if (courtId) where.court_id = courtId;

    const [bookings, blocks, classes] = await Promise.all([
        prisma.booking.findMany({
            where: { ...where, status: { notIn: ["CANCELLED", "EXPIRED"] } },
            include: { user: { select: { email: true } } }
        }),
        prisma.block.findMany({ where }),
        prisma.classEvent.findMany({ where })
    ]);

    return [
        ...bookings.map(b => ({ type: "BOOKING", ...b, title: b.user?.email || b.guest_name || "Reserva" })),
        ...blocks.map(b => ({ type: "BLOCK", ...b, title: b.reason || "Bloqueo" })),
        ...classes.map(c => ({ type: "CLASS", ...c, title: c.title }))
    ];
}

function isOverlapping(s1: Date, e1: Date, s2: Date, e2: Date) {
    return s1 < e2 && s2 < e1;
}
