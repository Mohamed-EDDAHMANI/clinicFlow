import { z } from 'zod';

const productFields = {
    name: z.string().trim().min(2).max(255),
    description: z.string().trim().max(5000).nullable().optional(),
    price: z.coerce.number().nonnegative().max(99999999.99),
    stock: z.coerce.number().int().nonnegative().optional(),
    image_url: z.url().nullable().optional(),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z
    .object(productFields)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const productIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});
