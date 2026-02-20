import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { KPI_CONFIG } from "../config/kpis.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const billingRouter = Router();

const billingQuerySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    includeCancelled: z.boolean().optional().default(false),
    payment_method: z.enum(["CASH", "CARD"]).optional()
});

// GET /api/billing/clients/summary
billingRouter.post(
    "/clients/summary",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = billingQuerySchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        const whereClause: any = {
            club_id: clubId,
            start_at: { gte: startDate },
            end_at: { lte: endDate }
        };

        if (!parsed.includeCancelled) {
            whereClause.status = { not: "CANCELLED" };
        }

        if (parsed.payment_method) {
            whereClause.payment_method = parsed.payment_method;
        }

        const reservations = await prisma.booking.findMany({
            where: whereClause,
            include: { user: true, court: true },
            orderBy: { start_at: "asc" }
        });

        const byClient: Record<string, any> = {};

        for (const resv of reservations) {
            const userId = resv.user_id || "guest";
            const userName = resv.user?.email || "Invitado";
            const durationMinutes = (resv.end_at.getTime() - resv.start_at.getTime()) / 60000;
            const price = resv.status === "CANCELLED" ? 0 : (resv.total_cents / 100);

            if (!byClient[userId]) {
                byClient[userId] = {
                    clientId: userId,
                    clientName: userName,
                    reservations: 0,
                    hours: 0,
                    revenue: 0,
                    cancelledCount: 0
                };
            }

            if (resv.status === "CANCELLED") {
                byClient[userId].cancelledCount += 1;
            } else {
                byClient[userId].reservations += 1;
                byClient[userId].hours += durationMinutes / 60;
                byClient[userId].revenue += price;
            }
        }

        const clientList = Object.values(byClient).map((c: any) => ({
            ...c,
            hours: Number(c.hours.toFixed(2)),
            revenue: Number(c.revenue.toFixed(2))
        }));

        const totals = {
            reservations: clientList.reduce((acc, c) => acc + c.reservations, 0),
            hours: Number(clientList.reduce((acc, c) => acc + c.hours, 0).toFixed(2)),
            revenue: Number(clientList.reduce((acc, c) => acc + c.revenue, 0).toFixed(2)),
            cancelledCount: clientList.reduce((acc, c) => acc + c.cancelledCount, 0)
        };


        res.json({
            meta: { ...parsed, timezone: KPI_CONFIG.timezone },
            byClient: clientList,
            totals
        });
    })
);

// POST /api/billing/clients/xlsx
billingRouter.post(
    "/clients/xlsx",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = billingQuerySchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        const whereClause: any = {
            club_id: clubId,
            start_at: { gte: startDate },
            end_at: { lte: endDate }
        };

        if (!parsed.includeCancelled) {
            whereClause.status = { not: "CANCELLED" };
        }

        if (parsed.payment_method) {
            whereClause.payment_method = parsed.payment_method;
        }

        const reservations = await prisma.booking.findMany({
            where: whereClause,
            include: { user: true, court: true },
            orderBy: { start_at: "asc" }
        });

        const byClient: Record<string, any> = {};
        const details = [];

        for (const resv of reservations) {
            const userId = resv.user_id || "guest";
            const userName = resv.user?.email || "Invitado";
            const durationMinutes = (resv.end_at.getTime() - resv.start_at.getTime()) / 60000;
            const price = resv.status === "CANCELLED" ? 0 : (resv.total_cents / 100);

            if (!byClient[userId]) {
                byClient[userId] = {
                    clientName: userName,
                    reservations: 0,
                    hours: 0,
                    revenue: 0,
                    cancelledCount: 0
                };
            }

            if (resv.status === "CANCELLED") {
                byClient[userId].cancelledCount += 1;
            } else {
                byClient[userId].reservations += 1;
                byClient[userId].hours += durationMinutes / 60;
                byClient[userId].revenue += price;
            }

            details.push({
                date: resv.start_at.toISOString().split("T")[0],
                clientName: userName,
                courtName: resv.court?.name || "Desconocida",
                start: resv.start_at.toISOString().substring(11, 16),
                end: resv.end_at.toISOString().substring(11, 16),
                priceTotal: price,
                status: resv.status
            });
        }

        const summaryList = Object.values(byClient).map((c: any) => ({
            ...c,
            hours: Number(c.hours.toFixed(2)),
            revenue: Number(c.revenue.toFixed(2))
        }));

        const totals = {
            reservations: summaryList.reduce((acc, c) => acc + c.reservations, 0),
            hours: Number(summaryList.reduce((acc, c) => acc + c.hours, 0).toFixed(2)),
            revenue: Number(summaryList.reduce((acc, c) => acc + c.revenue, 0).toFixed(2)),
            cancelledCount: summaryList.reduce((acc, c) => acc + c.cancelledCount, 0)
        };

        const filename = `facturacion_clientes_${parsed.from}_al_${parsed.to}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const { buildClientBillingExcel } = await import("../utils/xlsx/buildClientBillingExcel.js");
        await buildClientBillingExcel(res, { summaryList, details, totals });
    })
);
