import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { buildDiploma } from "../utils/pdf/diploma.js";
import { buildAmericanoTemplate } from "../utils/pdf/americano.js";
import PDFDocument from "pdfkit";

export const tournamentsRouter = Router();

const tournamentSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio."),
    date: z.string().datetime(),
    points_per_match: z.number().int().default(24),
    duration_minutes: z.number().int().default(180),
    match_duration_minutes: z.number().int().default(21),
    price_per_person: z.number().int().min(0),
});

// List tournaments
tournamentsRouter.get(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const tournaments = await prisma.tournament.findMany({
            where: { club_id: clubId },
            include: {
                _count: { select: { participants: true } }
            },
            orderBy: { date: "desc" },
        });
        res.json({ tournaments });
    })
);

// Get detail
tournamentsRouter.get(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const tournament = await prisma.tournament.findUnique({
            where: { id: id as string },
            include: {
                participants: {
                    include: { user: { select: { email: true, full_name: true } } },
                    orderBy: { total_points: "desc" }
                },
                matches: true
            }
        });
        if (!tournament) throw new ApiError(404, "NOT_FOUND", "Torneo no encontrado");
        res.json({ tournament });
    })
);

// Create
tournamentsRouter.post(
    "/",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const parsed = tournamentSchema.parse(req.body);

        const tournament = await prisma.tournament.create({
            data: {
                ...parsed,
                club_id: clubId!,
            }
        });

        res.status(201).json({ tournament });
    })
);

// Join / Add participant
tournamentsRouter.post(
    "/:id/participants",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const { user_id, name } = z.object({
            user_id: z.string().uuid().optional(),
            name: z.string().min(1).optional()
        }).refine(data => data.user_id || data.name, {
            message: "Se requiere user_id o name"
        }).parse(req.body);

        // Check if user already in tournament if user_id is provided
        if (user_id) {
            const existing = await prisma.tournamentParticipant.findUnique({
                where: { tournament_id_user_id: { tournament_id: id as string, user_id } }
            });
            if (existing) throw new ApiError(400, "BAD_REQUEST", "El usuario ya está inscrito");
        }

        const participant = await prisma.tournamentParticipant.create({
            data: {
                tournament_id: id as string,
                user_id,
                name
            }
        });

        res.status(201).json({ participant });
    })
);

import { createAuditLog } from "../utils/audit.js";

/**
 * GENERATE ROUNDS
 * Strict 8-player circular rotation for 8 rounds.
 */
tournamentsRouter.post(
    "/:id/generate-rounds",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const tournament = await prisma.tournament.findUnique({
            where: { id: id as string },
            include: { participants: true }
        });

        if (!tournament) throw new ApiError(404, "NOT_FOUND", "Torneo no encontrado");
        if (tournament.status === "ARCHIVED") throw new ApiError(400, "BAD_REQUEST", "Torneo archivado y no puede modificarse");

        const participants = tournament.participants;
        const n = participants.length;

        if (n !== 8) throw new ApiError(400, "BAD_REQUEST", "Para este formato profesional se requieren exactamente 8 participantes");

        // First, clear existing matches for this tournament to avoid duplicates
        await prisma.tournamentMatch.deleteMany({ where: { tournament_id: id as string } });

        const rounds = 8;
        const matchesCreated = [];

        // Method: Player 1 fixed, 2-8 rotate
        // Indices represent indices in participants array [0..7]
        const rotatorIndices = [1, 2, 3, 4, 5, 6, 7]; // Participants 2 to 8

        for (let r = 0; r < rounds; r++) {
            // Circle construction for this round
            // Top: [0, r0, r1, r2]
            // Bottom: [r6, r5, r4, r3]
            const top = [0, rotatorIndices[0], rotatorIndices[1], rotatorIndices[2]];
            const bottom = [rotatorIndices[6], rotatorIndices[5], rotatorIndices[4], rotatorIndices[3]];

            // Pairs (cross-circle pairing for variety)
            // (1,8), (2,7), (3,6), (4,5) - using Berger-style vertical pairs
            const pair1 = [participants[top[0]], participants[bottom[0]]];
            const pair2 = [participants[top[1]], participants[bottom[1]]];
            const pair3 = [participants[top[2]], participants[bottom[2]]];
            const pair4 = [participants[top[3]], participants[bottom[3]]];

            // Pista 1: Pair 1 vs Pair 2
            const m1 = await prisma.tournamentMatch.create({
                data: {
                    tournament_id: id as string,
                    round: r + 1,
                    player1_id: pair1[0].id,
                    player2_id: pair1[1].id,
                    player3_id: pair2[0].id,
                    player4_id: pair2[1].id,
                }
            });

            // Pista 2: Pair 3 vs Pair 4
            const m2 = await prisma.tournamentMatch.create({
                data: {
                    tournament_id: id as string,
                    round: r + 1,
                    player1_id: pair3[0].id,
                    player2_id: pair3[1].id,
                    player3_id: pair4[0].id,
                    player4_id: pair4[1].id,
                }
            });

            matchesCreated.push(m1, m2);

            // Rotate rotatorIndices (Shift right)
            const last = rotatorIndices.pop()!;
            rotatorIndices.unshift(last);
        }

        await createAuditLog(
            tournament.club_id,
            req.user!.userId,
            "GENERATE_ROUNDS",
            "Tournament",
            id as string,
            `Generadas 8 rondas para 8 jugadores.`
        );

        res.json({ message: `${matchesCreated.length} partidos generados en ${rounds} rondas`, matches: matchesCreated });
    })
);

// Archive Tournament
tournamentsRouter.patch(
    "/:id/archive",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const userRole = req.user?.role;

        if (userRole !== "ADMIN" && userRole !== "OWNER") {
            throw new ApiError(403, "FORBIDDEN", "Solo los administradores pueden archivar torneos.");
        }

        const tournament = await prisma.tournament.findUnique({ where: { id: id as string } });
        if (!tournament) throw new ApiError(404, "NOT_FOUND", "Torneo no encontrado");

        const updated = await prisma.tournament.update({
            where: { id: id as string },
            data: { status: "ARCHIVED" }
        });

        await createAuditLog(
            tournament.club_id,
            req.user!.userId,
            "ARCHIVE_TOURNAMENT",
            "Tournament",
            id as string
        );

        res.json({ tournament: updated });
    })
);

// Delete Tournament
tournamentsRouter.delete(
    "/:id",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const userRole = req.user?.role;

        if (userRole !== "ADMIN" && userRole !== "OWNER") {
            throw new ApiError(403, "FORBIDDEN", "Solo los administradores pueden borrar torneos.");
        }

        const tournament = await prisma.tournament.findUnique({ where: { id: id as string } });
        if (!tournament) throw new ApiError(404, "NOT_FOUND", "Torneo no encontrado");

        // Delete matches, participants, and bookings (if any) first or use cascade
        await prisma.$transaction([
            prisma.tournamentMatch.deleteMany({ where: { tournament_id: id as string } }),
            prisma.tournamentParticipant.deleteMany({ where: { tournament_id: id as string } }),
            prisma.booking.updateMany({ where: { tournament_id: id as string }, data: { tournament_id: null } }),
            prisma.tournament.delete({ where: { id: id as string } })
        ]);

        await createAuditLog(
            tournament.club_id,
            req.user!.userId,
            "DELETE_TOURNAMENT",
            "Tournament",
            id as string,
            `Nombre: ${tournament.name}`
        );

        res.json({ success: true });
    })
);

// Get Diploma PDF
tournamentsRouter.get(
    "/:id/diploma",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { id } = req.params;
        const tournament = await prisma.tournament.findUnique({
            where: { id: id as string },
            include: {
                club: true,
                participants: {
                    include: { user: true },
                    orderBy: { total_points: "desc" },
                    take: 1
                }
            }
        });

        if (!tournament) throw new ApiError(404, "NOT_FOUND", "Torneo no encontrado");
        const winner = tournament.participants[0];
        if (!winner) throw new ApiError(400, "BAD_REQUEST", "No hay participantes inscritos");

        const doc = new (PDFDocument as any)({ size: "A4", margin: 0 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Diploma_${winner.user?.email.split('@')[0] || "JUGADOR"}.pdf`);

        const winnerName = winner.name || (winner.user?.full_name || winner.user?.email.split('@')[0] || "JUGADOR").toUpperCase();

        doc.pipe(res);
        await buildDiploma(doc, {
            clubName: tournament.club.legal_name || "CLUB MANAGER PRO",
            tournamentName: tournament.name,
            winnerName: winnerName,
            date: tournament.date,
            points: winner.total_points
        });
        doc.end();
    })
);

// Get Americano Template PDF
tournamentsRouter.get(
    "/americano-template",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const clubId = req.user?.clubId;
        const club = await prisma.club.findUnique({
            where: { id: clubId }
        });

        if (!club) throw new ApiError(404, "NOT_FOUND", "Club no encontrado");

        const doc = new (PDFDocument as any)({ size: "A4", margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Americano_8_Jugadores.pdf`);

        doc.pipe(res);
        await buildAmericanoTemplate(doc, {
            clubName: club.legal_name || "CLUB MANAGER PRO",
            logoUrl: club.logo_url || undefined
        });
        doc.end();
    })
);

// Update match score
tournamentsRouter.patch(
    "/:id/matches/:matchId",
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res) => {
        const { matchId } = req.params;
        const { score_12, score_34 } = z.object({
            score_12: z.number().int().min(0),
            score_34: z.number().int().min(0)
        }).parse(req.body);

        const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId as string } });
        if (!match) throw new ApiError(404, "NOT_FOUND", "Partido no encontrado");

        const oldScore12 = match.score_12 || 0;
        const oldScore34 = match.score_34 || 0;

        // Update match and participants in transaction
        await prisma.$transaction(async (tx) => {
            await tx.tournamentMatch.update({
                where: { id: matchId as string },
                data: { score_12, score_34 }
            });

            // Revert old points and add new points for all 4 players
            await tx.tournamentParticipant.update({
                where: { id: match.player1_id },
                data: { total_points: { increment: score_12 - oldScore12 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player2_id },
                data: { total_points: { increment: score_12 - oldScore12 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player3_id },
                data: { total_points: { increment: score_34 - oldScore34 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player4_id },
                data: { total_points: { increment: score_34 - oldScore34 } }
            });
        });

        res.json({ message: "Resultado registrado correctamente" });
    })
);
