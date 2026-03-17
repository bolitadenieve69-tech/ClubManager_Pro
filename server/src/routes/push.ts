import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../utils/env.js';

export const pushRouter = Router();

// GET VAPID public key (unauthenticated — needed before login)
pushRouter.get('/vapid-key', (req, res) => {
    res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null });
});

// POST /push/subscribe — save admin push subscription
pushRouter.post(
    '/subscribe',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { endpoint, keys } = z.object({
            endpoint: z.string().url(),
            keys: z.object({ p256dh: z.string(), auth: z.string() })
        }).parse(req.body);

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: { club_id: clubId!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
            update: { p256dh: keys.p256dh, auth: keys.auth }
        });

        res.json({ ok: true });
    })
);

// DELETE /push/subscribe — remove subscription
pushRouter.delete(
    '/subscribe',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { endpoint } = z.object({ endpoint: z.string() }).parse(req.body);
        await prisma.pushSubscription.deleteMany({ where: { endpoint } });
        res.json({ ok: true });
    })
);
