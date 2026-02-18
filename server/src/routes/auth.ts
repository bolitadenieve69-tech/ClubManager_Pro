import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { env } from '../utils/env.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../middleware/error.js';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

// POST /auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ApiError(400, 'CONFLICT', 'El email ya está registrado');
    }

    // Create empty Club
    const club = await prisma.club.create({
        data: {},
    });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
        data: {
            email,
            password_hash,
            club_id: club.id,
        },
    });

    // Generate token
    const token = jwt.sign(
        { userId: user.id, clubId: club.id, role: user.role, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.status(201).json({
        token,
        user: {
            id: user.id,
            email: user.email,
        },
        club: {
            id: club.id,
        },
    });
}));

// POST /auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Email o contraseña incorrectos');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Email o contraseña incorrectos');
    }

    const token = jwt.sign(
        { userId: user.id, clubId: user.club_id, role: user.role, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ token });
}));

// GET /auth/me (protected)
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        select: {
            id: true,
            email: true,
            club_id: true,
            role: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado');
    }

    res.json({
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        club: {
            id: user.club_id,
        },
    });
}));

export default router;
