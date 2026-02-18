import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        public message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            ok: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    if (err instanceof z.ZodError) {
        return res.status(400).json({
            ok: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error de validación',
                details: err.flatten().fieldErrors,
            },
        });
    }

    console.error('💥 Unexpected error:', err);

    return res.status(500).json({
        ok: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Ha ocurrido un error inesperado',
        },
    });
};

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({
        ok: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Ruta no encontrada',
        },
    });
};
