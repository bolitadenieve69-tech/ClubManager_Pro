import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { buildDiploma } from "../utils/pdf/diploma.js";
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

/**
 * GENERATE ROUNDS
 * Simple rotation algorithm for Americano.
 * For now, simple enough for pairs.
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

        const participants = tournament.participants;
        const n = participants.length;

        if (n < 4) throw new ApiError(400, "BAD_REQUEST", "Se necesitan al menos 4 participantes");

        const roundsNeeded = Math.floor(tournament.duration_minutes / tournament.match_duration_minutes);
        const matchesCreated = [];

        for (let r = 1; r <= roundsNeeded; r++) {
            const rotated = [...participants];
            const shift = (r - 1) % n;
            for (let s = 0; s < shift; s++) rotated.push(rotated.shift()!);

            for (let i = 0; i < Math.floor(n / 4); i++) {
                const base = i * 4;
                const match = await prisma.tournamentMatch.create({
                    data: {
                        tournament_id: id as string,
                        round: r,
                        player1_id: rotated[base].id,
                        player2_id: rotated[base + 1].id,
                        player3_id: rotated[base + 2].id,
                        player4_id: rotated[base + 3].id,
                    }
                });
                matchesCreated.push(match);
            }
        }

        res.json({ message: `${matchesCreated.length} partidos generados en ${roundsNeeded} rondas`, matches: matchesCreated });
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

        // Update match and participants in transaction
        await prisma.$transaction(async (tx) => {
            // If there were old scores, we should revert them. (Simplified: assuming fresh entry)
            // Ideally: diff between old and new

            await tx.tournamentMatch.update({
                where: { id: matchId as string },
                data: { score_12, score_34 }
            });

            // Update individual player points
            await tx.tournamentParticipant.update({
                where: { id: match.player1_id },
                data: { total_points: { increment: score_12 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player2_id },
                data: { total_points: { increment: score_12 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player3_id },
                data: { total_points: { increment: score_34 } }
            });
            await tx.tournamentParticipant.update({
                where: { id: match.player4_id },
                data: { total_points: { increment: score_34 } }
            });
        });

        res.json({ message: "Resultado registrado correctamente" });
    })
);
