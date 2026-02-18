import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    APP_VERSION: z.string().default('1.0.0'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const env = _env.data;
