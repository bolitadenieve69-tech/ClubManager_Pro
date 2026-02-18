import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest, adminOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const courtsRouter = Router();

const courtCreateSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio."),
    surface_type: z.string().trim().nullable().optional(),
    lighting: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

const courtUpdateSchema = courtCreateSchema.partial();

courtsRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const courts = await prisma.court.findMany({
            where: { club_id: clubId },
            orderBy: { created_at: "desc" },
        });

        res.json({ courts });
    })
);

courtsRouter.post(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const parsed = courtCreateSchema.parse(req.body);

        const court = await prisma.court.create({
            data: {
                club_id: clubId!,
                name: parsed.name,
                surface_type: parsed.surface_type ?? null,
                lighting: parsed.lighting ?? false,
                is_active: parsed.is_active ?? true,
            },
        });

        res.status(201).json({ court, message: "Pista creada correctamente." });
    })
);

courtsRouter.put(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const parsed = courtUpdateSchema.parse(req.body);

        const existing = await prisma.court.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Pista no encontrada.");

        const court = await prisma.court.update({
            where: { id },
            data: {
                name: parsed.name ?? undefined,
                surface_type: parsed.surface_type ?? undefined,
                lighting: parsed.lighting ?? undefined,
                is_active: parsed.is_active ?? undefined,
            },
        });

        res.json({ court, message: "Pista actualizada correctamente." });
    })
);

courtsRouter.delete(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const existing = await prisma.court.findFirst({ where: { id, club_id: clubId } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Pista no encontrada.");

        await prisma.court.delete({ where: { id } });

        res.json({ message: "Pista eliminada correctamente." });
    })
);
