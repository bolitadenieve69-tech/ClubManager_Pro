import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const invoicesRouter = Router();

invoicesRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const invoices = await prisma.invoice.findMany({
            where: { club_id: clubId },
            include: { items: true },
            orderBy: { created_at: "desc" },
        });

        res.json({ invoices });
    })
);

// Get invoice detail
invoicesRouter.get(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const invoice = await prisma.invoice.findFirst({
            where: { id, club_id: clubId },
            include: {
                items: true,
                club: true,
                bookings: {
                    include: {
                        court: { select: { name: true } },
                        user: { select: { email: true } },
                    }
                }
            },
        });

        if (!invoice) throw new ApiError(404, "NOT_FOUND", "Factura no encontrada.");

        res.json(invoice);
    })
);

// Manual invoice generation (if needed)
invoicesRouter.post(
    "/generate",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const club = await prisma.club.findUnique({ where: { id: clubId } });
        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");

        const number = club.invoice_counter;

        const invoice = await prisma.$transaction(async (tx) => {
            const created = await tx.invoice.create({
                data: {
                    club_id: clubId!,
                    number,
                    total_cents: 0,
                    status: "ISSUED",
                },
            });

            await tx.club.update({
                where: { id: clubId },
                data: { invoice_counter: { increment: 1 } },
            });

            return created;
        });

        res.status(201).json({ invoice, message: "Factura generada correctamente." });
    })
);
