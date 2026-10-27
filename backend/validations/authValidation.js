import { z } from 'zod';

export const email = z.string().trim().toLowerCase().pipe(z.email());

export const password = z.string().min(6, 'Password must be at least 6 characters').max(72);

export const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(255);

export const loginSchema = z.object({
    email,
    password: z.string().min(1, 'Password is required'),
});
