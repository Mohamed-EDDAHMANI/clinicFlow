import { z } from 'zod';

const today = () => new Date().toISOString().slice(0, 10);

export const createPatientSchema = z.object({
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
    cin: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, 'CIN must contain 4 to 20 letters or digits'),
    phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Phone must contain 8 to 15 digits'),
    birth_date: z.iso.date('Birth date must be a valid date (YYYY-MM-DD)')
        .refine((date) => date <= today(), 'Birth date cannot be in the future'),
    address: z.string().trim().max(500).nullish(),
});

export const updatePatientSchema = createPatientSchema;

export const patientIdParamSchema = z.object({
    id: z.uuid('Invalid patient id'),
});

export const listPatientsQuerySchema = z.object({
    search: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});
