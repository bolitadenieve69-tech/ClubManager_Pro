import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { calculateReservationPrice } from "../utils/pricing.js";
import { generateOccurrences, RecurringRule } from "../utils/recurring.js";
import { randomUUID } from 'node:crypto';

export const reservationsRouter = Router();

const reservationSchema = z.object({
    court_id: z.string().uuid("ID de pista inválido."),
    user_id: z.string().uuid("ID de usuario inválido."),
    start_time: z.string().datetime("Fecha de inicio inválida."),
    end_time: z.string().datetime("Fecha de fin inválida."),
    strategy: z.enum(["SINGLE", "SPLIT"]).default("SINGLE")
}).refine(data => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    if (start >= end) return false;

    const isSameDay = start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    const isMidnightEnd = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
    const prevDayOfEnd = new Date(end.getTime() - 1000);
    const isSameDayIfMidnight = start.getFullYear() === prevDayOfEnd.getFullYear() &&
        start.getMonth() === prevDayOfEnd.getMonth() &&
        start.getDate() === prevDayOfEnd.getDate();

    return isSameDay || (isMidnightEnd && isSameDayIfMidnight);
}, {
    message: "Las reservas deben empezar y terminar el mismo día (no pueden cruzar medianoche).",
    path: ["end_time"],
});

// List club reservations
reservationsRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const reservations = await prisma.booking.findMany({
            where: { club_id: clubId },
            include: {
                court: { select: { name: true } },
                user: { select: { email: true, full_name: true } },
            },
            orderBy: { start_at: "asc" },
        });

        res.json({ reservations });
    })
);

// Calculate price (dry-run)
reservationsRouter.post(
    "/calculate",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = reservationSchema.parse(req.body);

        const start = new Date(parsed.start_time);
        const end = new Date(parsed.end_time);

        const allPrices = await prisma.price.findMany({
            where: { club_id: clubId, court_id: parsed.court_id }
        });

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { price_per_player_cents: true, slot_minutes: true }
        });

        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");

        try {
            const pricingResult = calculateReservationPrice(start, end, allPrices.map(p => ({
                hourly_rate: p.hourly_rate,
                valid_days: p.valid_days,
                start_time: p.start_time,
                end_time: p.end_time
            })), {
                granularityMinutes: club.slot_minutes,
                defaultHourlyRate: (club.price_per_player_cents * 4) // Approximation of hourly rate if missing
            });

            res.json(pricingResult);
        } catch (e: any) {
            throw new ApiError(400, "VALIDATION_ERROR", e.message);
        }
    })
);

// Create reservation
reservationsRouter.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = reservationSchema.parse(req.body);

        const start = new Date(parsed.start_time);
        const end = new Date(parsed.end_time);

        // 1. Validate court
        const court = await prisma.court.findFirst({
            where: { id: parsed.court_id, club_id: clubId },
        });
        if (!court) throw new ApiError(404, "NOT_FOUND", "Pista no encontrada.");

        // 2. Validate overlaps
        const overlapping = await prisma.booking.findFirst({
            where: {
                court_id: parsed.court_id,
                status: "CONFIRMED",
                OR: [
                    {
                        start_at: { lt: end },
                        end_at: { gt: start },
                    },
                ],
            },
        });

        if (overlapping) {
            throw new ApiError(409, "CONFLICT", "La pista ya está reservada en este tramo horario.");
        }

        // 3. Pricing
        const allPrices = await prisma.price.findMany({
            where: {
                club_id: clubId,
                OR: [
                    { court_id: parsed.court_id },
                    { court_id: { equals: null } }
                ] as any
            }
        });

        const sortedPrices = [...allPrices].sort((a, b) => {
            if (a.court_id && !b.court_id) return -1;
            if (!a.court_id && b.court_id) return 1;
            return 0;
        });

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { price_per_player_cents: true, slot_minutes: true, invoice_counter: true }
        });

        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");

        const pricingResult = calculateReservationPrice(start, end, sortedPrices.map(p => ({
            hourly_rate: p.hourly_rate,
            valid_days: p.valid_days,
            start_time: p.start_time,
            end_time: p.end_time
        })), {
            granularityMinutes: club.slot_minutes,
            defaultHourlyRate: (club.price_per_player_cents * 4)
        });
        const totalPrice = pricingResult.totalCents;

        // 4. Transaction: Create Invoice (optional) + Reservation + Shares
        const { reservation, invoice } = await prisma.$transaction(async (tx) => {
            const txClub = await tx.club.findUnique({
                where: { id: clubId },
                select: { invoice_counter: true }
            });
            if (!txClub) throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");

            const invoiceNumber = txClub.invoice_counter;

            const newInvoice = await tx.invoice.create({
                data: {
                    club_id: clubId!,
                    number: invoiceNumber,
                    total_cents: totalPrice,
                    status: "ISSUED",
                    items: {
                        create: [{
                            description: `Reserva de pista: ${court.name}`,
                            quantity: 1,
                            unit_price: totalPrice,
                            total_price: totalPrice,
                        }]
                    }
                }
            });

            // Lógica de expiración: 2 horas para PWA/BIZUM, 24h para el resto
            const isGuestBooking = req.user?.role === "USER";
            const expiryTime = isGuestBooking ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

            const newReservation = await tx.booking.create({
                data: {
                    club_id: clubId!,
                    court_id: parsed.court_id,
                    user_id: parsed.user_id,
                    invoice_id: newInvoice.id,
                    start_at: start,
                    end_at: end,
                    total_cents: totalPrice,
                    price_cents: Math.floor(totalPrice / 4),
                    strategy: parsed.strategy,
                    status: "PENDING_PAYMENT",
                    expires_at: new Date(Date.now() + expiryTime)
                },
                include: {
                    court: { select: { name: true } },
                    user: { select: { email: true, full_name: true } },
                }
            });

            // Create Payment Shares
            if (parsed.strategy === "SPLIT") {
                const shareAmount = Math.floor(totalPrice / 4);
                const sharesData = [];
                for (let i = 0; i < 4; i++) {
                    sharesData.push({
                        booking_id: newReservation.id,
                        user_id: parsed.user_id, // Placeholder: all to creator initially
                        amount: shareAmount,
                        status: i === 0 ? "INITIATED" : "INITIATED" // Creator initiated their share
                    });
                }
                await tx.paymentShare.createMany({ data: sharesData });
            } else {
                // SINGLE strategy: 1 share for the full amount
                await tx.paymentShare.create({
                    data: {
                        booking_id: newReservation.id,
                        user_id: parsed.user_id,
                        amount: totalPrice,
                        status: "INITIATED"
                    }
                });
            }

            await tx.club.update({
                where: { id: clubId },
                data: { invoice_counter: { increment: 1 } }
            });

            return { reservation: newReservation, invoice: newInvoice };
        });

        res.status(201).json({
            reservation,
            invoice,
            message: parsed.strategy === "SPLIT"
                ? "Reserva creada. Tienes 2 horas para confirmar los pagos por Bizum."
                : "Reserva creada. Tienes 2 horas para confirmar el pago por Bizum."
        });
    })
);

// Cancel reservation
reservationsRouter.delete(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const id = req.params.id as string;

        const existing = await prisma.booking.findFirst({
            where: { id, club_id: clubId },
        });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Reserva no encontrada.");

        await prisma.booking.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        res.json({ message: "Reserva cancelada correctamente." });
    })
);
