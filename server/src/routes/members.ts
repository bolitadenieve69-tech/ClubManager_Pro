import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

export const membersRouter = Router();

// Create a member directly (Admin)
membersRouter.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { full_name, whatsapp_phone, status } = z.object({
            full_name: z.string().min(1),
            whatsapp_phone: z.string().min(9),
            status: z.enum(["APPROVED", "PENDING"]).default("APPROVED")
        }).parse(req.body);

        const member = await prisma.member.create({
            data: {
                club_id: clubId!,
                full_name,
                whatsapp_phone,
                status
            }
        });

        res.status(201).json({ member });
    })
);

// Admin: Invite a member
membersRouter.post(
    "/invitations",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const { fullName, whatsappPhone } = z.object({
            fullName: z.string().min(1),
            whatsappPhone: z.string().min(9)
        }).parse(req.body);

        // Find or create member
        let member = await prisma.member.findUnique({
            where: { club_id_whatsapp_phone: { club_id: clubId!, whatsapp_phone: whatsappPhone } }
        });

        if (!member) {
            member = await prisma.member.create({
                data: {
                    club_id: clubId!,
                    full_name: fullName,
                    whatsapp_phone: whatsappPhone,
                    status: "PENDING"
                }
            });
        }

        // Cancel any previous pending invitations for this member
        await prisma.invitation.updateMany({
            where: { member_id: member.id, status: "PENDING" },
            data: { status: "CANCELLED" }
        });

        const token = crypto.randomBytes(32).toString("hex");
        const invitation = await prisma.invitation.create({
            data: {
                club_id: clubId!,
                member_id: member.id,
                inviter_user_id: req.user?.userId,
                token,
                status: "PENDING",
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
            }
        });

        const inviteUrl = `/join/${token}`;
        res.status(201).json({ invitation, inviteUrl });
    })
);

// PWA: Validate invitation without consuming it
membersRouter.get(
    "/invitations/:token",
    asyncHandler(async (req, res) => {
        const { token } = z.object({ token: z.string() }).parse(req.params);

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                club: {
                    select: { display_name: true, logo_url: true }
                },
                member: {
                    select: { full_name: true }
                }
            }
        });

        if (!invitation) {
            throw new ApiError(404, "NOT_FOUND", "La invitación no existe.");
        }

        if (invitation.status !== "PENDING" || invitation.expires_at < new Date()) {
            throw new ApiError(400, "INVALID_TOKEN", "La invitación ya no es válida o ha expirado.");
        }

        res.json({
            valid: true,
            member: invitation.member,
            club: invitation.club
        });
    })
);

// PWA: Accept invitation
membersRouter.post(
    "/invitations/accept",
    asyncHandler(async (req, res) => {
        const { token, password } = z.object({
            token: z.string(),
            password: z.string().min(4)
        }).parse(req.body);

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { club: true, member: true }
        });

        if (!invitation || invitation.status !== "PENDING" || invitation.expires_at < new Date()) {
            throw new ApiError(400, "INVALID_TOKEN", "La invitación es inválida o ha expirado.");
        }

        const member = invitation.member;
        let userId: string;

        await prisma.$transaction(async (tx) => {
            // 1. Mark invitation as used
            await tx.invitation.update({
                where: { id: invitation.id },
                data: {
                    status: "USED",
                    used_at: new Date()
                }
            });

            // 2. Approve member
            await tx.member.update({
                where: { id: invitation.member_id },
                data: { status: "APPROVED" }
            });

            // 3. Create User with the password chosen by the member
            // Virtual email: phone@guest.club (used for login with phone number)
            const virtualEmail = `${member.whatsapp_phone}@guest.club`;

            const password_hash = await bcrypt.hash(password, 10);
            let user = await tx.user.findUnique({ where: { email: virtualEmail } });

            if (!user) {
                user = await tx.user.create({
                    data: {
                        email: virtualEmail,
                        full_name: member.full_name,
                        password_hash,
                        club_id: invitation.club_id,
                        role: "USER"
                    }
                });
            } else {
                // Member already existed — update password so they can recover access
                user = await tx.user.update({
                    where: { id: user.id },
                    data: { password_hash }
                });
            }

            userId = user.id;

            // Link member to user
            await tx.member.update({
                where: { id: member.id },
                data: { user_id: userId }
            });
        });

        // Generate token for immediate login
        const user = await prisma.user.findUnique({ where: { id: userId! } });
        const sessionToken = jwt.sign(
            { userId: user!.id, clubId: user!.club_id, role: user!.role, email: user!.email },
            env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            message: "Invitación aceptada correctamente",
            token: sessionToken,
            user: {
                id: user!.id,
                email: user!.email,
                full_name: user!.full_name
            }
        });
    })
);

// Admin: Export members as CSV
membersRouter.get(
    "/export",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const members = await prisma.member.findMany({
            where: { club_id: clubId },
            orderBy: { full_name: "asc" }
        });

        // Generate CSV using simple string (safe for this schema)
        // Header
        let csv = "Nombre Completo,WhatsApp,Estado,Registrado\n";

        for (const m of members) {
            const hasUser = m.user_id ? "SÍ" : "NO";
            // Escape possible commas in names
            const escapedName = `"${m.full_name?.replace(/"/g, '""')}"`;
            csv += `${escapedName},${m.whatsapp_phone},${m.status},${hasUser}\n`;
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=clientes_club.csv");
        res.status(200).send(csv);
    })
);

membersRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const members = await prisma.member.findMany({
            where: { club_id: clubId },
            orderBy: { full_name: "asc" }
        });
        res.json({ members });
    })
);
