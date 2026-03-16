import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";

export const announcementsRouter = Router();

const announcementSchema = z.object({
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(1000),
    image_url: z.string().url().optional().nullable(),
    cta_label: z.string().max(50).optional().nullable(),
    cta_url: z.string().url().optional().nullable(),
    pinned: z.boolean().optional().default(false),
    expires_at: z.string().datetime().optional().nullable(),
});

// GET /announcements — all users (mobile app reads active ones)
announcementsRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const now = new Date();

        const announcements = await prisma.announcement.findMany({
            where: {
                club_id: clubId!,
                active: true,
                OR: [
                    { expires_at: null },
                    { expires_at: { gt: now } }
                ]
            },
            orderBy: [
                { pinned: "desc" },
                { created_at: "desc" }
            ]
        });

        res.json({ announcements });
    })
);

// GET /announcements/all — admin only (includes inactive)
announcementsRouter.get(
    "/all",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;

        const announcements = await prisma.announcement.findMany({
            where: { club_id: clubId! },
            orderBy: [{ pinned: "desc" }, { created_at: "desc" }]
        });

        res.json({ announcements });
    })
);

// POST /announcements — create
announcementsRouter.post(
    "/",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const data = announcementSchema.parse(req.body);

        const announcement = await prisma.announcement.create({
            data: {
                club_id: clubId!,
                title: data.title,
                body: data.body,
                image_url: data.image_url ?? null,
                cta_label: data.cta_label ?? null,
                cta_url: data.cta_url ?? null,
                pinned: data.pinned ?? false,
                expires_at: data.expires_at ? new Date(data.expires_at) : null,
            }
        });

        res.status(201).json({ announcement });
    })
);

// PATCH /announcements/:id/toggle — activate / deactivate
announcementsRouter.patch(
    "/:id/toggle",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { id } = z.object({ id: z.string() }).parse(req.params);

        const existing = await prisma.announcement.findFirst({ where: { id, club_id: clubId! } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Anuncio no encontrado.");

        const announcement = await prisma.announcement.update({
            where: { id },
            data: { active: !existing.active }
        });

        res.json({ announcement });
    })
);

// DELETE /announcements/:id
announcementsRouter.delete(
    "/:id",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { id } = z.object({ id: z.string() }).parse(req.params);

        const existing = await prisma.announcement.findFirst({ where: { id, club_id: clubId! } });
        if (!existing) throw new ApiError(404, "NOT_FOUND", "Anuncio no encontrado.");

        await prisma.announcement.delete({ where: { id } });
        res.json({ message: "Anuncio eliminado." });
    })
);

// POST /announcements/quick-send — send any custom message/URL to all members (no announcement needed)
announcementsRouter.post(
    "/quick-send",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { message } = z.object({ message: z.string().min(1) }).parse(req.body);

        const members = await prisma.member.findMany({
            where: { club_id: clubId!, status: "APPROVED" },
            select: { full_name: true, whatsapp_phone: true }
        });

        const contacts = members.map(m => ({
            name: m.full_name,
            phone: m.whatsapp_phone,
            waUrl: `https://wa.me/${m.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${m.full_name}! 👋\n\n${message}`)}`
        }));

        res.json({ contacts, messageText: message });
    })
);

// GET /announcements/:id/whatsapp-preview — returns members + formatted messages
announcementsRouter.get(
    "/:id/whatsapp-preview",
    authMiddleware,
    adminOnly,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { id } = z.object({ id: z.string() }).parse(req.params);

        const [announcement, members] = await Promise.all([
            prisma.announcement.findFirst({ where: { id, club_id: clubId! } }),
            prisma.member.findMany({
                where: { club_id: clubId!, status: "APPROVED" },
                select: { full_name: true, whatsapp_phone: true }
            })
        ]);

        if (!announcement) throw new ApiError(404, "NOT_FOUND", "Anuncio no encontrado.");

        const messageText = `${announcement.title}\n\n${announcement.body}${announcement.cta_url ? `\n\n${announcement.cta_label || 'Más info'}: ${announcement.cta_url}` : ''}`;

        const contacts = members.map(m => ({
            name: m.full_name,
            phone: m.whatsapp_phone,
            waUrl: `https://wa.me/${m.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${m.full_name}! 👋\n\n${messageText}`)}`
        }));

        res.json({ announcement, contacts, messageText });
    })
);
