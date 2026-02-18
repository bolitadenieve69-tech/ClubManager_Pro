import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const kpisRouter = Router();

import { KPI_CONFIG } from "../config/kpis.js";

const operationalKpiSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    courtId: z.string(), // "all" or valid UUID
    segmentMinutes: z.coerce.number().default(30),
    includeCancelled: z.boolean().optional().default(false)
});

// GET /config
kpisRouter.get(
    "/config",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req, res) => {
        res.json(KPI_CONFIG);
    })
);

// POST /operational
kpisRouter.post(
    "/operational",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = operationalKpiSchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        const whereClause: any = {
            club_id: clubId,
            start_at: { gte: startDate },
            end_at: { lte: endDate }
        };

        if (parsed.courtId !== "all") {
            whereClause.court_id = parsed.courtId;
        }

        // Fetch all reservations in range to calculate cancellation rate
        const reservations = await prisma.booking.findMany({
            where: whereClause,
            include: { court: true },
            orderBy: { start_at: "asc" }
        });

        // Fetch courts for denominator calculations
        const courts = await prisma.court.findMany({
            where: { club_id: clubId, id: parsed.courtId !== "all" ? parsed.courtId : undefined }
        });

        const activeReservations = reservations.filter(r => r.status !== "CANCELLED");
        const cancelledReservations = reservations.filter(r => r.status === "CANCELLED");

        const totals = {
            reservations: activeReservations.length,
            minutesBooked: activeReservations.reduce((acc, r) => acc + (r.end_at.getTime() - r.start_at.getTime()) / 60000, 0),
            revenue: activeReservations.reduce((acc, r) => acc + (r.total_cents / 100), 0),
            cancelledCount: cancelledReservations.length,
            cancellationRate: reservations.length > 0 ? Number(((cancelledReservations.length / reservations.length) * 100).toFixed(2)) : 0
        };

        // --- Calculate Availability & Occupancy by Court ---
        const { calculateMinutesAvailable, generateHeatmap } = await import("../utils/analytics.js");

        const byCourt = courts.map(court => {
            const minutesAvailable = calculateMinutesAvailable(startDate, endDate, KPI_CONFIG.openingHours);
            const courtActiveRes = activeReservations.filter(r => r.court_id === court.id);
            const courtCancelledRes = cancelledReservations.filter(r => r.court_id === court.id);
            const minutesBooked = courtActiveRes.reduce((acc, r) => acc + (r.end_at.getTime() - r.start_at.getTime()) / 60000, 0);

            return {
                courtId: court.id,
                courtName: court.name,
                minutesBooked,
                minutesAvailable,
                occupancyPct: minutesAvailable > 0 ? Number(((minutesBooked / minutesAvailable) * 100).toFixed(2)) : 0,
                revenue: Number(courtActiveRes.reduce((acc, r) => acc + (r.total_cents / 100), 0).toFixed(2)),
                cancelledCount: courtCancelledRes.length,
                reservations: courtActiveRes.length
            };
        });

        // --- Heatmap Generation ---
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayToIndex = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

        const timeSlots: string[] = [];
        for (let h = 8; h < 22; h++) {
            for (let m = 0; m < 60; m += parsed.segmentMinutes) {
                timeSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }

        const matrix = generateHeatmap(
            parsed.includeCancelled ? reservations : activeReservations,
            timeSlots,
            parsed.segmentMinutes,
            dayToIndex
        );

        // --- Peak/Off-peak Analysis ---
        const flatSlots: any[] = [];
        matrix.forEach((row, rIdx) => {
            row.forEach((minutes, cIdx) => {
                flatSlots.push({
                    day: days[rIdx],
                    time: timeSlots[cIdx],
                    minutesBooked: minutes,
                });
            });
        });

        const peakOffpeak = {
            topByOccupancy: [...flatSlots].sort((a, b) => b.minutesBooked - a.minutesBooked).slice(0, 5),
            bottomByOccupancy: [...flatSlots].filter(s => s.minutesBooked >= 0).sort((a, b) => a.minutesBooked - b.minutesBooked).slice(0, 5),
            topByRevenue: []
        };

        res.json({
            meta: { ...parsed, timezone: KPI_CONFIG.timezone },
            totals: {
                ...totals,
                hoursBooked: Number((totals.minutesBooked / 60).toFixed(2))
            },
            byCourt,
            heatmap: {
                bucketMinutes: parsed.segmentMinutes,
                days,
                timeSlots,
                matrix,
                unit: "minutesBooked"
            },
            peakOffpeak
        });
    })
);
