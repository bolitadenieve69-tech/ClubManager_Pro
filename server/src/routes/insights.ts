import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateMinutesAvailable } from "../utils/analytics.js";

export const insightsRouter = Router();

const insightsQuerySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    courtId: z.string(),
    segmentMinutes: z.coerce.number().default(30),
    includeCancelled: z.boolean().optional().default(false),
    compareToPreviousPeriod: z.boolean().optional().default(true)
});

import { KPI_CONFIG } from "../config/kpis.js";

insightsRouter.post(
    "/operational",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = insightsQuerySchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        // Helper to fetch data for a range
        const getRangeStats = async (start: Date, end: Date) => {
            const whereClause: any = {
                club_id: clubId,
                start_at: { gte: start },
                end_at: { lte: end }
            };
            if (parsed.courtId !== "all") whereClause.court_id = parsed.courtId;

            const resvs = await prisma.booking.findMany({ where: whereClause });
            const active = resvs.filter(r => r.status !== "CANCELLED");
            const cancelled = resvs.filter(r => r.status === "CANCELLED");

            const minutesBooked = active.reduce((acc, r) => acc + (r.end_at.getTime() - r.start_at.getTime()) / 60000, 0);
            const minutesAvailable = calculateMinutesAvailable(start, end, KPI_CONFIG.openingHours);

            return {
                count: active.length,
                revenue: active.reduce((acc, r) => acc + (r.total_cents / 100), 0),
                cancelledCount: cancelled.length,
                cancellationRate: resvs.length > 0 ? cancelled.length / resvs.length : 0,
                minutesBooked,
                minutesAvailable,
                occupancyPct: minutesAvailable > 0 ? minutesBooked / minutesAvailable : 0,
                rawReservations: resvs
            };
        };

        const currentStats = await getRangeStats(startDate, endDate);

        // --- Comparisons ---
        let comparisons: any = null;
        if (parsed.compareToPreviousPeriod) {
            const diffMs = endDate.getTime() - startDate.getTime();
            const prevEnd = new Date(startDate.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - diffMs);

            const prevStats = await getRangeStats(prevStart, prevEnd);
            comparisons = {
                previousPeriod: {
                    from: prevStart.toISOString().split('T')[0],
                    to: prevEnd.toISOString().split('T')[0],
                    delta: {
                        occupancyPct: Number((currentStats.occupancyPct - prevStats.occupancyPct).toFixed(4)),
                        revenue: Number((currentStats.revenue - prevStats.revenue).toFixed(2)),
                        cancellationRate: Number((currentStats.cancellationRate - prevStats.cancellationRate).toFixed(4))
                    }
                }
            };
        }

        // --- Rules Engine ---
        const insights: any[] = [];
        const alerts: any[] = [];

        // 1. Cancellation Spike
        if (currentStats.cancellationRate > KPI_CONFIG.thresholds.cancellationSpike) {
            alerts.push({
                id: "cancellation_spike",
                severity: "warning",
                title: "Aumento de cancelaciones",
                threshold: "cancelRate > 15%",
                value: Number(currentStats.cancellationRate.toFixed(4))
            });
        }

        // 2. Low Occupancy Analysis 
        if (currentStats.occupancyPct < KPI_CONFIG.thresholds.lowOccupancy) {
            insights.push({
                id: "low_occupancy",
                severity: "info",
                title: "Baja ocupación general",
                summary: `La ocupación promedio (${(currentStats.occupancyPct * 100).toFixed(1)}%) está por debajo del umbral del 15%.`,
                recommendations: [
                    {
                        actionType: "promotion_suggestion",
                        label: "Lanzar campaña 'Happy Hour' en franjas valle",
                        expectedImpact: { metric: "occupancyPct", direction: "up", range: "medium" },
                        params: { discountPct: 20 }
                    }
                ]
            });
        }

        // 3. Overcrowded Analysis
        if (currentStats.occupancyPct > KPI_CONFIG.thresholds.overcrowded) {
            insights.push({
                id: "overcrowded",
                severity: "critical",
                title: "Capacidad al límite",
                summary: "El club está operando por encima del 85% de su capacidad.",
                recommendations: [
                    {
                        actionType: "pricing_adjustment",
                        label: "Revisar tarifas Peak (incremento sugerido 10%)",
                        expectedImpact: { metric: "revenue", direction: "up", range: "large" },
                        params: { increasePct: 10 }
                    }
                ]
            });
        }

        res.json({
            meta: parsed,
            insights,
            alerts,
            comparisons,
            currentStatsSummary: {
                occupancyPct: Number(currentStats.occupancyPct.toFixed(4)),
                revenue: Number(currentStats.revenue.toFixed(2)),
                cancellationRate: Number(currentStats.cancellationRate.toFixed(4))
            }
        });
    })
);
