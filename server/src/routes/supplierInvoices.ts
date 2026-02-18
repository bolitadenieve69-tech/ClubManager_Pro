import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { z } from "zod";
import { ApiError } from "../middleware/error.js";

const router = Router();

// Validation schema
const supplierInvoiceSchema = z.object({
    provider_name: z.string().min(1),
    category: z.string().min(1),
    amount_cents: z.number().int().positive(),
    date: z.string().optional(),
    invoice_number: z.string().optional(),
    attachment_url: z.string().url().optional().or(z.literal("")),
    status: z.enum(["PENDING", "PAID"]).default("PENDING")
});

router.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const invoices = await prisma.supplierInvoice.findMany({
            where: { club_id: clubId },
            orderBy: { date: "desc" }
        });
        res.json({ invoices });
    })
);

router.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        if (!clubId) throw new ApiError(401, "UNAUTHORIZED", "No club found");

        const data = supplierInvoiceSchema.parse(req.body);

        const invoice = await prisma.supplierInvoice.create({
            data: {
                ...data,
                club_id: clubId,
                date: data.date ? new Date(data.date) : new Date()
            }
        });

        // If marked as PAID, potentially create a movement
        if (invoice.status === "PAID") {
            await prisma.movement.create({
                data: {
                    club_id: clubId,
                    amount_cents: -invoice.amount_cents, // Negative because it's an expense
                    concept: `Pago factura ${invoice.provider_name} #${invoice.invoice_number || invoice.id.slice(0, 8)}`,
                    category: "GASTO_PROVEEDOR",
                    date: invoice.date
                }
            });
        }

        res.status(201).json({ invoice });
    })
);

router.patch(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params as { id: string };
        const clubId = req.user?.clubId;

        const existing = await prisma.supplierInvoice.findUnique({
            where: { id }
        });

        if (!existing || existing.club_id !== clubId) {
            throw new ApiError(404, "NOT_FOUND", "Factura no encontrada");
        }

        const data = supplierInvoiceSchema.partial().parse(req.body);

        const updated = await prisma.supplierInvoice.update({
            where: { id: id as string },
            data: {
                ...data,
                date: data.date ? new Date(data.date) : undefined
            }
        });

        // If status changed to PAID, create movement
        if (existing.status !== "PAID" && updated.status === "PAID") {
            await prisma.movement.create({
                data: {
                    club_id: clubId as string,
                    amount_cents: -updated.amount_cents,
                    concept: `Pago factura ${updated.provider_name} #${updated.invoice_number || updated.id.slice(0, 8)}`,
                    category: "GASTO_PROVEEDOR",
                    date: updated.date
                }
            });
        }

        res.json({ invoice: updated });
    })
);

router.delete(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params as { id: string };
        const clubId = req.user?.clubId;

        const existing = await prisma.supplierInvoice.findUnique({
            where: { id }
        });

        if (!existing || existing.club_id !== clubId) {
            throw new ApiError(404, "NOT_FOUND", "Factura no encontrada");
        }

        await prisma.supplierInvoice.delete({
            where: { id: id as string }
        });

        res.status(204).send();
    })
);

export default router;
