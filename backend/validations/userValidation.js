import { z } from 'zod';
import { ROLES } from '../config/permissions.js';
import { name, email, password } from './authValidation.js';

export const createUserSchema = z.object({
    name,
    email,
    password,
    role: z.enum(Object.values(ROLES)).optional(),
});
