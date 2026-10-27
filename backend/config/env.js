import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRES_IN: z.string().regex(/^\d+(ms|s|m|h|d)$/, 'Use a duration like 15m, 1h or 1d').default('15m'),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().min(1).transform((value) => value.split(',').map((origin) => origin.trim())),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('Invalid environment variables:');
    for (const issue of result.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

const env = result.data;

export default env;
