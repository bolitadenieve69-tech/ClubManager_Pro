import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const pricesRouter = Router();

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido. Usa HH:MM.");

const priceSchema = z.object({
    court_id: z.string().uuid("court_id inválido.").nullable().optional(),
    hourly_rate: z.number().int().min(0, "La tarifa debe ser >= 0."),
    valid_days: z.string().min(1, "Debes indicar días válidos."),
    start_time: hhmm,
    end_time: hhmm,
});

const priceUpdateSchema = priceSchema.partial();

pricesRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const prices = await prisma.price.findMany({
            where: { club_id: clubId },
            orderBy: { created_at: "desc" },
            include: {
                court: { select: { id: true, name: true } },
            },
        });

        res.json({ prices });
    })
);

pricesRouter.post(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = priceSchema.parse(req.body);

        if (parsed.court_id) {
            const court = await prisma.court.findFirst({
                where: { id: parsed.court_id, club_id: clubId },
                select: { id: true },
            });
            if (!court) throw new ApiError(404, "NOT_FOUND", "La pista no existe o no pertenece a tu club.");
        }

        const price = await prisma.price.create({
            data: {
                club_id: clubId!,
                court_id: parsed.court_id || null,
                hourly_rate: parsed.hourly_rate,
                valid_days: parsed.valid_days,
                start_time: parsed.start_time,
                end_time: parsed.end_time,
            },
        });

        res.status(201).json({ price, message: "Tramo de precio creado correctamente." });
    })
);

pricesRouter.put(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const parsed = priceUpdateSchema.parse(req.body);

        const existing = await prisma.price.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Tramo de precio no encontrado.");

        if (parsed.court_id) {
            const court = await prisma.court.findFirst({
                where: { id: parsed.court_id, club_id: clubId },
                select: { id: true },
            });
            if (!court) throw new ApiError(404, "NOT_FOUND", "La pista no existe o no pertenece a tu club.");
        }

        const price = await prisma.price.update({
            where: { id },
            data: {
                ...parsed,
                court_id: parsed.court_id === null ? null : (parsed.court_id ?? undefined)
            } as any,
        });

        res.json({ price, message: "Tramo de precio actualizado correctamente." });
    })
);

pricesRouter.delete(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const existing = await prisma.price.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Tramo de precio no encontrado.");

        await prisma.price.delete({ where: { id } });

        res.json({ message: "Tramo de precio eliminado correctamente." });
    })
);
