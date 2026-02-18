import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const ratesRouter = Router();

const rateCreateSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    price: z.number().min(0, "El precio debe ser un número positivo."),
    duration: z.number().int().min(1, "La duración mínima es de 1 minuto.").default(60),
});

const rateUpdateSchema = rateCreateSchema.partial();

ratesRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const rates = await prisma.rate.findMany({
            where: { club_id: clubId },
            orderBy: { created_at: "desc" },
        });

        res.json({ rates });
    })
);

ratesRouter.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = rateCreateSchema.parse(req.body);

        const rate = await prisma.rate.create({
            data: {
                club_id: clubId!,
                name: parsed.name,
                price: parsed.price,
                duration: parsed.duration,
            },
        });

        res.status(201).json({ rate, message: "Tarifa creada correctamente." });
    })
);

ratesRouter.put(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;
        const parsed = rateUpdateSchema.parse(req.body);

        const existing = await prisma.rate.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Tarifa no encontrada.");

        const rate = await prisma.rate.update({
            where: { id },
            data: {
                name: parsed.name ?? undefined,
                price: parsed.price ?? undefined,
                duration: parsed.duration ?? undefined,
            },
        });

        res.json({ rate, message: "Tarifa actualizada correctamente." });
    })
);

ratesRouter.delete(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const existing = await prisma.rate.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Tarifa no encontrada.");

        await prisma.rate.delete({ where: { id } });

        res.json({ message: "Tarifa eliminada correctamente." });
    })
);
