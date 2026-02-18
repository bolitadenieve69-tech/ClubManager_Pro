import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { ApiError } from './error.js';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        clubId: string;
        role: string;
        email: string;
    };
}

export const authMiddleware = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new ApiError(401, 'UNAUTHORIZED', 'No autorizado.');
    }

    const token = header.slice('Bearer '.length);

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as {
            userId: string;
            clubId: string;
            role: string;
            email: string;
        };

        req.user = {
            userId: payload.userId,
            clubId: payload.clubId,
            role: payload.role,
            email: payload.email
        };
        return next();
    } catch {
        throw new ApiError(401, 'UNAUTHORIZED', 'Token inválido o expirado.');
    }
};

export const adminOnly = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'FORBIDDEN', 'Acceso restringido a administradores.');
    }
    return next();
};
