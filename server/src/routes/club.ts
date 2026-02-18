import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { authMiddleware, AuthRequest, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../middleware/error.js';

const router = Router();

// Schema for updating club data
const updateClubSchema = z.object({
    legal_name: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
    tax_id: z.string().nullable().optional(),
    fiscal_address: z.string().nullable().optional(),
    default_vat: z.number().min(0).max(100).nullable().optional(),
    currency: z.string().nullable().optional(),
    invoice_prefix: z.string().nullable().optional(),
    phone_whatsapp: z.string().nullable().optional(),
    bizum_payee: z.string().nullable().optional(),
});

// GET /club - Get user's club data
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const clubId = req.user?.clubId;

    if (!clubId) {
        throw new ApiError(400, "VALIDATION_ERROR", "No se encontró el club asociado.");
    }

    const club = await prisma.club.findUnique({
        where: { id: clubId },
    });

    if (!club) {
        throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");
    }

    res.json(club);
}));

// PATCH /club - Update club data
router.patch('/', authMiddleware, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
    const clubId = req.user?.clubId;

    if (!clubId) {
        throw new ApiError(400, "VALIDATION_ERROR", "No se encontró el club asociado.");
    }

    const validatedData = updateClubSchema.parse(req.body);

    const updatedClub = await prisma.club.update({
        where: { id: clubId },
        data: validatedData,
    });

    res.json(updatedClub);
}));

export default router;
