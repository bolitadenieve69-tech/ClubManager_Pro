import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const movementsRouter = Router();

const movementSchema = z.object({
    amount_cents: z.number().int(),
    concept: z.string().min(1, "El concepto es obligatorio."),
    category: z.string().optional(),
    date: z.string().datetime().optional(),
});

// List movements
movementsRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { from, to } = req.query;

        const where: any = { club_id: clubId };

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from as string);
            if (to) where.date.lte = new Date(to as string);
        }

        const movements = await prisma.movement.findMany({
            where,
            orderBy: { date: "desc" },
        });

        res.json({ movements });
    })
);

// Create movement
movementsRouter.post(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = movementSchema.parse(req.body);

        const movement = await prisma.movement.create({
            data: {
                club_id: clubId!,
                amount_cents: parsed.amount_cents,
                concept: parsed.concept,
                category: parsed.category,
                date: parsed.date ? new Date(parsed.date) : undefined,
            },
        });

        res.status(201).json({ movement });
    })
);

// Delete movement
movementsRouter.delete(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { id } = req.params;

        const existing = await prisma.movement.findFirst({
            where: {
                id: id as string,
                club_id: clubId as string
            },
        });

        if (!existing) {
            throw new ApiError(404, "NOT_FOUND", "Movimiento no encontrado.");
        }

        await prisma.movement.delete({
            where: { id: id as string },
        });

        res.json({ message: "Movimiento eliminado correctamente." });
    })
);
