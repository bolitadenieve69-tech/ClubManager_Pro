import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const closeoutsRouter = Router();

// Endpoint para verificar salud de la DB (usado por el modo degradado del frontend)
closeoutsRouter.get(
    "/health",
    asyncHandler(async (req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.json({ status: "ok", database: "connected" });
        } catch (err: any) {
            console.error("DB Health Check Failed:", err.message);
            res.status(503).json({
                status: "error",
                database: "disconnected",
                message: "No se puede alcanzar la base de datos (P1001 o similar)."
            });
        }
    })
);

const closeoutCreateSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional()
});

// GET /api/closeouts - Listar periodos
closeoutsRouter.get(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const closeouts = await prisma.closeoutPeriod.findMany({
            where: { club_id: clubId },
            orderBy: { created_at: "desc" }
        });
        res.json({ closeouts });
    })
);

// POST /api/closeouts - Crear un nuevo snapshot
closeoutsRouter.post(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = closeoutCreateSchema.parse(req.body);

        const startDate = new Date(`${parsed.from}T00:00:00Z`);
        const endDate = new Date(`${parsed.to}T23:59:59Z`);

        // 1. Calcular totales para el periodo (Snapshot)
        const reservations = await prisma.booking.findMany({
            where: {
                club_id: clubId,
                start_at: { gte: startDate },
                end_at: { lte: endDate },
                status: { not: "CANCELLED" }
            }
        });

        const totalRevenueCents = reservations.reduce((acc, r) => acc + r.total_cents, 0);
        const totalMinutes = reservations.reduce((acc, r) => acc + (r.end_at.getTime() - r.start_at.getTime()) / 60000, 0);

        // 2. Crear el registro inmutable
        const closeout = await prisma.closeoutPeriod.create({
            data: {
                club_id: clubId!,
                from: startDate,
                to: endDate,
                total_revenue: totalRevenueCents / 100,
                total_hours: Number((totalMinutes / 60).toFixed(2)),
                reservation_count: reservations.length,
                notes: parsed.notes,
                created_by: req.user?.email || "unknown"
            }
        });

        res.status(201).json(closeout);
    })
);

// GET /api/closeouts/:id - Detalle
closeoutsRouter.get(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const closeout = await prisma.closeoutPeriod.findFirst({
            where: { id: req.params.id as string, club_id: req.user?.clubId }
        });
        if (!closeout) return res.status(404).json({ message: "Cierre no encontrado" });
        res.json(closeout);
    })
);

// POST /api/closeouts/:id/xlsx - Exportar el snapshot inmutable
closeoutsRouter.post(
    "/:id/xlsx",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const closeout = await prisma.closeoutPeriod.findFirst({
            where: { id: req.params.id as string, club_id: req.user?.clubId }
        });
        if (!closeout) return res.status(404).json({ message: "Cierre no encontrado" });

        const filename = `cierre_${closeout.from.toISOString().split('T')[0]}_al_${closeout.to.toISOString().split('T')[0]}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const { buildCloseoutExcel } = await import("../utils/xlsx/buildCloseoutExcel.js");
        await buildCloseoutExcel(res, closeout);
    })
);
