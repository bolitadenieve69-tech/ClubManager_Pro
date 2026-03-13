import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const usersRouter = Router();

usersRouter.get(
    "/me/stats",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user?.userId;

        const activeReservations = await prisma.booking.count({
            where: {
                user_id: userId,
                status: "CONFIRMED",
                start_at: { gte: new Date() }
            }
        });

        const playedMatches = await prisma.booking.count({
            where: {
                user_id: userId,
                status: "CONFIRMED",
                start_at: { lt: new Date() }
            }
        });

        res.json({
            activeReservations,
            playedMatches
        });
    })
);

usersRouter.get(
    "/me/activity",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user?.userId;

        const activity = await prisma.booking.findMany({
            where: { user_id: userId },
            include: {
                court: { select: { name: true } }
            },
            orderBy: { start_at: "desc" },
            take: 20
        });

        res.json(activity);
    })
);
