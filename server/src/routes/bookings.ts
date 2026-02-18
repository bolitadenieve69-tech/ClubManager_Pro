import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { addMinutes } from "date-fns";

export const bookingsRouter = Router();

const bookingSchema = z.object({
    courtId: z.string().uuid(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    paymentStrategy: z.enum(["SPLIT", "SINGLE"]),
    members: z.array(z.string().uuid()).max(4).min(1), // Split players or main payer
});

// CREATE BOOKING
bookingsRouter.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const userId = req.user?.userId;
        const parsed = bookingSchema.parse(req.body);

        const start = new Date(parsed.startAt);
        const end = new Date(parsed.endAt);

        // 1. Fetch Club Config
        const club = await prisma.club.findUnique({ where: { id: clubId! } });
        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado");

        // 2. Validate availability (simple check here, shared with occupancy)
        // ... (Already handled by PWA call to availability, but good to double check)

        const expiresAt = addMinutes(new Date(), 15); // Hardcoded 15 min expiry for now
        const pricePerPlayer = club.price_per_player_cents;
        const totalPrice = (parsed.paymentStrategy === "SINGLE") ? pricePerPlayer * 4 : pricePerPlayer * parsed.members.length;

        // 3. Create Booking + Shares in Transaction
        const booking = await prisma.$transaction(async (tx) => {
            const newBooking = await tx.booking.create({
                data: {
                    club_id: clubId!,
                    court_id: parsed.courtId,
                    user_id: userId!,
                    start_at: start,
                    end_at: end,
                    status: "PENDING_PAYMENT",
                    strategy: parsed.paymentStrategy,
                    price_cents: pricePerPlayer,
                    total_cents: totalPrice,
                    expires_at: expiresAt
                }
            });

            // Create shares
            if (parsed.paymentStrategy === "SINGLE") {
                await tx.paymentShare.create({
                    data: {
                        booking_id: newBooking.id,
                        user_id: userId!,
                        amount: totalPrice,
                        status: "INITIATED"
                    }
                });
            } else {
                // SPLIT: One share per member provided
                for (const mPlayerId of parsed.members) {
                    await tx.paymentShare.create({
                        data: {
                            booking_id: newBooking.id,
                            user_id: mPlayerId, // Assuming passed IDs are Member -> User mappings or similar
                            amount: pricePerPlayer,
                            status: "INITIATED"
                        }
                    });
                }
            }

            return newBooking;
        });

        // Instructions for Bizum
        const whatsappMsg = `Reserva en ${club.legal_name}. Pista: ${parsed.courtId}. Total: ${(totalPrice / 100).toFixed(2)}€. Concepto: B-${booking.id.slice(0, 8)}`;
        const whatsappLink = `https://wa.me/${club.bizum_payee}?text=${encodeURIComponent(whatsappMsg)}`;

        res.status(201).json({
            booking,
            whatsappLink,
            instructions: `Envía un Bizum de ${(totalPrice / 100).toFixed(2)}€ a ${club.bizum_payee} con el concepto B-${booking.id.slice(0, 8)}`
        });
    })
);

// MARK AS PAID (by player)
bookingsRouter.post(
    "/:id/shares/:shareId/i-paid",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id, shareId } = req.params as { id: string; shareId: string };
        const { proofNote } = z.object({ proofNote: z.string().optional() }).parse(req.body);

        await prisma.paymentShare.update({
            where: { id: shareId },
            data: {
                status: "PENDING_REVIEW",
                proof_note: proofNote
            }
        });

        res.json({ message: "Pago marcado para revisión" });
    })
);

// CONFIRM PAYMENT (by admin)
bookingsRouter.post(
    "/:id/shares/:shareId/confirm",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        if (req.user?.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "Solo administradores");

        const { id, shareId } = req.params as { id: string; shareId: string };

        await prisma.$transaction(async (tx) => {
            await tx.paymentShare.update({
                where: { id: shareId },
                data: { status: "PAID", paid_at: new Date() }
            });

            // Check if all shares are paid
            const allShares = await tx.paymentShare.findMany({
                where: { booking_id: id }
            });

            const allPaid = allShares.every(s => s.status === "PAID");
            if (allPaid) {
                await tx.booking.update({
                    where: { id },
                    data: { status: "CONFIRMED" }
                });
            }
        });

        res.json({ message: "Pago confirmado localmente" });
    })
);

// GET BOOKING BY ID
bookingsRouter.get(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params as { id: string };
        const clubId = req.user?.clubId;

        const booking = await prisma.booking.findFirst({
            where: { id, club_id: clubId },
            include: {
                shares: true,
                court: true,
                club: {
                    select: {
                        legal_name: true,
                        bizum_payee: true
                    }
                }
            }
        });

        if (!booking) throw new ApiError(404, "NOT_FOUND", "Reserva no encontrada");

        res.json({ booking });
    })
);
