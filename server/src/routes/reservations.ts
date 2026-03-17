import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { calculateReservationPrice } from "../utils/pricing.js";
import { generateOccurrences, RecurringRule } from "../utils/recurring.js";
import { randomUUID } from 'node:crypto';
import { isWithinOpenHours, getSpainHHMM, getSpainDay, spainLocalToUtc } from "../utils/validation.js";
import { notifyClub } from "../utils/pushNotify.js";

export const reservationsRouter = Router();

// Socio PWA: Check availability
reservationsRouter.get(
    "/availability",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { date, duration, courtCount } = z.object({
            date: z.string(), // YYYY-MM-DD
            duration: z.coerce.number().min(30).max(180),
            courtCount: z.coerce.number().min(1).max(2).default(1)
        }).parse(req.query);

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const courts = await prisma.court.findMany({ where: { club_id: clubId } });
        const courtIds = courts.map(c => c.id);

        // Fetch bookings, holds (non-expired), and blocks
        const bookings = await prisma.booking.findMany({
            where: {
                club_id: clubId,
                status: { in: ["CONFIRMED", "HOLD"] },
                OR: [
                    { hold_expires_at: null },
                    { hold_expires_at: { gt: new Date() } }
                ],
                start_at: { gte: startOfDay, lte: endOfDay }
            }
        });

        const blocks = await prisma.block.findMany({
            where: { club_id: clubId, start_at: { lte: endOfDay }, end_at: { gte: startOfDay } }
        });

        const club = await prisma.club.findUnique({ where: { id: clubId! } });
        const openHours = club?.open_hours ? JSON.parse(club.open_hours) : {};
        const day = getSpainDay(startOfDay).toString();
        const schedule = openHours[day];

        // 10:00 to 22:00 in 30min slots (FALLBACK if no schedule)
        let startHour = 10;
        let endHour = 22;

        if (schedule) {
            startHour = parseInt(schedule.open.split(':')[0]);
            endHour = parseInt(schedule.close.split(':')[0]);
            if (schedule.close.endsWith(':30')) endHour += 0.5; // Rough estimate for loop
        }

        const slots = [];
        for (let hour = startHour; hour < endHour; hour++) {
            for (let min of [0, 30]) {
                const hourInt = Math.floor(hour);
                const minOffset = (hour % 1 !== 0) ? 30 : 0;

                const slotStart = new Date(startOfDay);
                slotStart.setHours(hourInt, min + minOffset, 0, 0);
                const slotEnd = new Date(slotStart.getTime() + duration * 60000);

                // Skip if before open or after close
                if (!isWithinOpenHours(slotStart, slotEnd, openHours)) continue;

                // Return time in Spain local time so the slot grid matches club wall-clock time
                const timeStr = getSpainHHMM(slotStart);

                // For each court, check if available
                const availableCourts = courtIds.filter(cId => {
                    const isBooked = bookings.some(b =>
                        (b.court_id === cId || b.court_ids.includes(cId)) &&
                        b.start_at < slotEnd && b.end_at > slotStart
                    );
                    const isBlocked = blocks.some(b =>
                        b.court_id === cId && b.start_at < slotEnd && b.end_at > slotStart
                    );
                    return !isBooked && !isBlocked;
                });

                if (availableCourts.length >= courtCount) {
                    slots.push({ time: timeStr, available: true, courts: availableCourts.slice(0, courtCount) });
                } else {
                    slots.push({ time: timeStr, available: false, courts: [] });
                }
            }
        }

        res.json({ slots });
    })
);

// Socio PWA: Create HOLD
reservationsRouter.post(
    "/hold",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const userId = req.user?.userId;
        const { courtIds, date, startTime, duration } = z.object({
            courtIds: z.array(z.string()),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            duration: z.number().min(30).max(300),
        }).parse(req.body);

        // Client sends Spain local time; convert to UTC for DB storage
        const start = spainLocalToUtc(date, startTime);
        const end = new Date(start.getTime() + duration * 60000);

        // Fix 1: Re-verify availability to prevent race conditions
        const conflict = await prisma.booking.findFirst({
            where: {
                club_id: clubId!,
                status: { in: ["CONFIRMED", "HOLD"] },
                start_at: { lt: end },
                end_at: { gt: start },
                OR: [
                    { hold_expires_at: null },
                    { hold_expires_at: { gt: new Date() } }
                ],
                AND: [
                    {
                        OR: [
                            { court_id: { in: courtIds } },
                            { court_ids: { hasSome: courtIds } }
                        ]
                    }
                ]
            }
        });

        if (conflict) throw new ApiError(409, "CONFLICT", "La pista ya no está disponible. Por favor, selecciona otra hora.");

        const club = await prisma.club.findUnique({ where: { id: clubId! } });
        
        // Fix: Check Opening Hours
        if (!isWithinOpenHours(start, end, club?.open_hours || "{}")) {
            throw new ApiError(400, "OUT_OF_HOURS", "La reserva está fuera del horario de apertura del club.");
        }

        // Fix: Check Blocks explicitly for HOLD creation
        const blockConflict = await prisma.block.findFirst({
            where: {
                club_id: clubId!,
                court_id: { in: courtIds },
                start_at: { lt: end },
                end_at: { gt: start }
            }
        });
        if (blockConflict) throw new ApiError(409, "CONFLICT", "La pista está bloqueada por mantenimiento o evento.");

        const holdMinutes = club?.hold_minutes || 10;

        // Fix 2: Calculate price server-side using club pricing configuration
        const prices = await prisma.price.findMany({
            where: {
                club_id: clubId!,
                OR: [
                    { court_id: null },
                    { court_id: { in: courtIds } }
                ]
            }
        });

        let totalCents = 0;
        try {
            const result = calculateReservationPrice(start, end, prices);
            totalCents = result.totalCents * courtIds.length;
        } catch {
            // No price config found — set to 0, admin can adjust later
        }

        const booking = await prisma.booking.create({
            data: {
                club_id: clubId!,
                court_id: courtIds[0],
                court_ids: courtIds,
                user_id: userId!,
                start_at: start,
                end_at: end,
                status: "HOLD",
                source: "PWA",
                amount_paid: 0,
                payment_status: "PENDIENTE",
                hold_expires_at: new Date(Date.now() + holdMinutes * 60000),
                total_cents: totalCents,
                price_cents: Math.floor(totalCents / courtIds.length),
            }
        });

        // Notify club admin via Web Push
        const court = await prisma.court.findUnique({ where: { id: courtIds[0] } });
        const timeStr = getSpainHHMM(start);
        notifyClub(clubId!, {
            title: '🎾 Nueva Reserva',
            body: `Pista ${court?.name ?? 'desconocida'} · ${date} a las ${timeStr}`,
            url: '/reservations'
        }).catch(() => {});

        res.json({ booking });
    })
);


// Socio PWA: Confirm (Pay in Reception)
reservationsRouter.post(
    "/confirm",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { bookingId } = z.object({ bookingId: z.string() }).parse(req.body);

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: "CONFIRMED",
                hold_expires_at: null,
                payment_status: "PENDIENTE"
            }
        });

        res.json({ message: "Reserva confirmada. Paga en recepción al llegar.", booking });
    })
);

// Socio PWA: Create Bizum Payment
reservationsRouter.post(
    "/payments/bizum/create",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { bookingId, amountCents } = z.object({
            bookingId: z.string(),
            amountCents: z.number()
        }).parse(req.body);

        const payment = await prisma.payment.create({
            data: {
                booking_id: bookingId,
                amount_cents: amountCents,
                provider: "BIZUM",
                status: "PENDING"
            }
        });

        // Simulating PSP response
        res.json({
            payment,
            redirectUrl: `https://bizum.sim/pay/${payment.id}?amount=${amountCents}`
        });
    })
);

// Socio PWA: Bizum Webhook (Simulation)
reservationsRouter.post(
    "/payments/bizum/webhook",
    asyncHandler(async (req, res) => {
        const { paymentId, status, amountCents } = z.object({
            paymentId: z.string(),
            status: z.enum(["SUCCESS", "FAILED"]),
            amountCents: z.number()
        }).parse(req.body);

        await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { id: paymentId },
                data: { status }
            });

            if (status === "SUCCESS") {
                const booking = await tx.booking.findUnique({
                    where: { id: payment.booking_id }
                });

                if (booking) {
                    const newAmountPaid = (booking.amount_paid || 0) + amountCents;
                    const isTotal = newAmountPaid >= (booking.total_cents || 0);

                    await tx.booking.update({
                        where: { id: booking.id },
                        data: {
                            amount_paid: newAmountPaid,
                            payment_status: isTotal ? "PAGADO" : "PARCIAL",
                            status: "CONFIRMED",
                            hold_expires_at: null
                        }
                    });
                }
            }
        });

        res.json({ received: true });
    })
);

const reservationSchema = z.object({
    court_id: z.string().uuid("ID de pista inválido."),
    user_id: z.string().uuid("ID de usuario inválido.").optional().nullable(),
    guest_name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    payment_method: z.enum(["CASH", "CARD", "BIZUM"]).optional(),
    start_time: z.string().datetime("Fecha de inicio inválida.").optional(),
    end_time: z.string().datetime("Fecha de fin inválida.").optional(),
    start_at: z.string().datetime().optional(),
    end_at: z.string().datetime().optional(),
    strategy: z.enum(["SINGLE", "SPLIT"]).default("SINGLE"),
    skipConflicts: z.boolean().optional().default(false),
    recurring: z.object({
        frequency: z.enum(['weekly']),
        interval: z.number().default(1),
        weekdays: z.array(z.number().min(0).max(6)).optional(),
        endCondition: z.enum(['date', 'count']).optional().default('count'),
        endDate: z.string().optional(),
        maxOccurrences: z.number().min(1).max(52).optional(),
        // Legacy field — backwards compatible
        weeks: z.number().min(1).max(12).optional()
    }).optional()
}).refine(data => {
    const startStr = data.start_time || data.start_at;
    const endStr = data.end_time || data.end_at;
    if (!startStr || !endStr) return false;

    const start = new Date(startStr);
    const end = new Date(endStr);
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

        const startStr = parsed.start_time || parsed.start_at;
        const endStr = parsed.end_time || parsed.end_at;
        if (!startStr || !endStr) throw new ApiError(400, "VALIDATION_ERROR", "Fechas de inicio y fin son obligatorias.");

        const start = new Date(startStr);
        const end = new Date(endStr);

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
                end_time: p.end_time,
                valid_from: p.valid_from,
                valid_until: p.valid_until,
            })), {
                granularityMinutes: club.slot_minutes,
                defaultHourlyRate: (club.price_per_player_cents * 4)
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

        const startStr = parsed.start_time || parsed.start_at;
        const endStr = parsed.end_time || parsed.end_at;
        if (!startStr || !endStr) throw new ApiError(400, "VALIDATION_ERROR", "Fechas de inicio y fin son obligatorias.");

        const start = new Date(startStr);
        const end = new Date(endStr);

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

        // Fix: Check Opening Hours
        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { price_per_player_cents: true, slot_minutes: true, invoice_counter: true, open_hours: true }
        });

        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado.");

        if (!isWithinOpenHours(start, end, club.open_hours)) {
            throw new ApiError(400, "OUT_OF_HOURS", "La reserva está fuera del horario de apertura del club.");
        }

        // Fix: Check Blocks for manual reservation
        const blockOverlap = await prisma.block.findFirst({
            where: {
                court_id: parsed.court_id,
                start_at: { lt: end },
                end_at: { gt: start }
            }
        });
        if (blockOverlap) throw new ApiError(409, "CONFLICT", "La pista está bloqueada en este horario.");

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

        const pricingResult = calculateReservationPrice(start, end, sortedPrices.map(p => ({
            hourly_rate: p.hourly_rate,
            valid_days: p.valid_days,
            start_time: p.start_time,
            end_time: p.end_time,
            valid_from: p.valid_from,
            valid_until: p.valid_until,
        })), {
            granularityMinutes: club.slot_minutes,
            defaultHourlyRate: (club.price_per_player_cents * 4)
        });
        const totalPrice = pricingResult.totalCents;

        // Recurring logic
        let occurrences = [{ start, end }];
        if (parsed.recurring) {
            const recurringData = parsed.recurring;
            const rules: RecurringRule = {
                frequency: recurringData.frequency,
                interval: recurringData.interval,
                weekdays: recurringData.weekdays || [start.getDay()],
                endCondition: recurringData.endCondition || 'count',
                maxOccurrences: recurringData.maxOccurrences || recurringData.weeks || 1,
                endDate: recurringData.endDate ? new Date(recurringData.endDate) : undefined
            };
            const generated = generateOccurrences(start, end, rules);
            occurrences = generated.filter(o => o.isValid !== false).map(o => ({ start: o.start, end: o.end }));
        }

        const recurringId = parsed.recurring ? randomUUID() : null;
        const shouldSkipConflicts = parsed.skipConflicts || false;

        // Cash payments go to the register only — no invoice, no fiscal accounting
        const isCash = parsed.payment_method === "CASH";

        // 4. Transaction: Create everything for each occurrence efficiently
        const results = await prisma.$transaction(async (tx) => {
            // Check overlaps for ALL occurrences at once
            const overlapping = await tx.booking.findMany({
                where: {
                    court_id: parsed.court_id,
                    status: "CONFIRMED",
                    OR: occurrences.map(occ => ({
                        start_at: { lt: occ.end },
                        end_at: { gt: occ.start },
                    }))
                }
            });

            if (overlapping.length > 0) {
                if (!shouldSkipConflicts) {
                    const firstMatch = overlapping[0];
                    throw new ApiError(409, "CONFLICT", `La pista ya está reservada el día ${firstMatch.start_at.toLocaleDateString()} en este tramo horario.`);
                }
            }

            // Filter out occurrences that have overlaps if skipConflicts is true
            const validOccurrences = occurrences.filter(occ => {
                const hasOverlap = overlapping.some(b => b.start_at < occ.end && b.end_at > occ.start);
                return !hasOverlap;
            });

            if (validOccurrences.length === 0) return [];

            // Only increment invoice counter for billable (non-cash) payments
            let startInvoiceNumber = 0;
            if (!isCash) {
                const txClub = await tx.club.update({
                    where: { id: clubId },
                    data: { invoice_counter: { increment: validOccurrences.length } },
                    select: { invoice_counter: true }
                });
                startInvoiceNumber = txClub.invoice_counter - validOccurrences.length;
            }

            const isGuestBooking = req.user?.role === "USER";
            const expiryTime = isGuestBooking ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const now = new Date();

            const invoiceData: any[] = [];
            const bookingData: any[] = [];
            const sharesData: any[] = [];
            const movementsData: any[] = [];
            const createdBookings: any[] = [];

            for (let i = 0; i < validOccurrences.length; i++) {
                const occ = validOccurrences[i];
                const bookingId = randomUUID();

                if (isCash) {
                    // Cash: no invoice — register as cash movement in the register
                    bookingData.push({
                        id: bookingId,
                        club_id: clubId!,
                        court_id: parsed.court_id,
                        user_id: parsed.user_id || null,
                        guest_name: parsed.guest_name || null,
                        phone: parsed.phone || null,
                        payment_method: "CASH",
                        invoice_id: null,
                        recurring_id: recurringId,
                        start_at: occ.start,
                        end_at: occ.end,
                        total_cents: totalPrice,
                        price_cents: Math.floor(totalPrice / 4),
                        strategy: parsed.strategy,
                        status: "CONFIRMED",
                        amount_paid: totalPrice,
                        payment_status: "PAGADO",
                        hold_expires_at: new Date(Date.now() + expiryTime),
                        created_at: now
                    });

                    movementsData.push({
                        id: randomUUID(),
                        club_id: clubId!,
                        amount_cents: totalPrice,
                        concept: `Reserva en efectivo — ${court.name} (${occ.start.toLocaleDateString("es-ES")})`,
                        category: "CAJA",
                        date: occ.start,
                        created_at: now
                    });
                } else {
                    // Card / Bizum: create invoice for fiscal accounting
                    const invoiceId = randomUUID();
                    const invoiceNumber = startInvoiceNumber + i;

                    invoiceData.push({
                        id: invoiceId,
                        club_id: clubId!,
                        number: invoiceNumber,
                        total_cents: totalPrice,
                        status: "ISSUED",
                        created_at: now
                    });

                    bookingData.push({
                        id: bookingId,
                        club_id: clubId!,
                        court_id: parsed.court_id,
                        user_id: parsed.user_id || null,
                        guest_name: parsed.guest_name || null,
                        phone: parsed.phone || null,
                        payment_method: parsed.payment_method || null,
                        invoice_id: invoiceId,
                        recurring_id: recurringId,
                        start_at: occ.start,
                        end_at: occ.end,
                        total_cents: totalPrice,
                        price_cents: Math.floor(totalPrice / 4),
                        strategy: parsed.strategy,
                        status: "CONFIRMED",
                        hold_expires_at: new Date(Date.now() + expiryTime),
                        created_at: now
                    });
                }

                if (parsed.strategy === "SPLIT") {
                    const shareAmount = Math.floor(totalPrice / 4);
                    sharesData.push({
                        id: randomUUID(),
                        booking_id: bookingId,
                        user_id: parsed.user_id,
                        amount: shareAmount,
                        status: "INITIATED",
                        created_at: now
                    });
                    for (let j = 0; j < 3; j++) {
                        sharesData.push({
                            id: randomUUID(),
                            booking_id: bookingId,
                            user_id: null,
                            amount: shareAmount,
                            status: "INITIATED",
                            created_at: now
                        });
                    }
                } else {
                    sharesData.push({
                        id: randomUUID(),
                        booking_id: bookingId,
                        user_id: parsed.user_id,
                        amount: totalPrice,
                        status: "INITIATED",
                        created_at: now
                    });
                }

                createdBookings.push({ id: bookingId, start_at: occ.start });
            }

            // BATCH INSERTS
            if (invoiceData.length > 0) {
                await tx.invoice.createMany({ data: invoiceData });
                const invoiceItemsData = invoiceData.map(inv => ({
                    id: randomUUID(),
                    invoice_id: inv.id,
                    description: `Reserva de pista: ${court.name}`,
                    quantity: 1,
                    unit_price: totalPrice,
                    total_price: totalPrice,
                    created_at: now
                }));
                await tx.invoiceItem.createMany({ data: invoiceItemsData });
            }

            await tx.booking.createMany({ data: bookingData });
            await tx.paymentShare.createMany({ data: sharesData });

            if (movementsData.length > 0) {
                await tx.movement.createMany({ data: movementsData });
            }

            return createdBookings;
        });

        res.status(201).json({
            reservations: results,
            count: results.length,
            message: parsed.recurring
                ? `Se han creado ${results.length} reservas recurrentes. Tienes 2 horas para confirmar el pago por Bizum.`
                : "Reserva creada. Tienes 2 horas para confirmar el pago por Bizum."
        });
    })
);

// JOIN RESERVATION (Claim a share)
reservationsRouter.post(
    "/:id/join",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const bookingId = req.params.id as string;
        const userId = req.user?.userId;

        if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Usuario no identificado.");

        // Check if user already has a share in this booking
        const existingShare = await prisma.paymentShare.findFirst({
            where: { booking_id: bookingId, user_id: userId }
        });
        if (existingShare) {
            return res.json({ message: "Ya formas parte de esta reserva.", share: existingShare });
        }

        // Find an unclaimed share
        const unclaimedShare = await prisma.paymentShare.findFirst({
            where: { booking_id: bookingId, user_id: null }
        });

        if (!unclaimedShare) {
            throw new ApiError(400, "FULL", "Esta reserva ya no tiene plazas disponibles.");
        }

        const updatedShare = await prisma.paymentShare.update({
            where: { id: unclaimedShare.id },
            data: { user_id: userId }
        });

        res.json({ message: "Te has unido a la reserva con éxito.", share: updatedShare });
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
