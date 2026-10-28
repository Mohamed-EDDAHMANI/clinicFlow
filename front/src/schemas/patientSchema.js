import { z } from 'zod'

const today = () => new Date().toISOString().slice(0, 10)

export const patientSchema = z.object({
  full_name: z.string().trim()
    .min(2, 'Saisissez le nom complet du patient (2 caractères minimum).')
    .max(255, 'Le nom ne doit pas dépasser 255 caractères.'),
  cin: z.string().trim().toUpperCase()
    .regex(/^[A-Z0-9]{4,20}$/, 'Le CIN contient 4 à 20 lettres ou chiffres, sans espace. Exemple : AB123456.'),
  phone: z.string().transform((value) => value.replace(/[\s.-]/g, ''))
    .pipe(z.string().regex(/^\+?[0-9]{8,15}$/, 'Le téléphone contient 8 à 15 chiffres. Exemple : 0612345678.')),
  birth_date: z.string()
    .min(1, 'Saisissez la date de naissance.')
    .refine((date) => date <= today(), 'La date de naissance ne peut pas être dans le futur.'),
  address: z.string().trim()
    .max(500, "L'adresse ne doit pas dépasser 500 caractères.")
    .transform((value) => value || null),
})

export const PATIENT_FIELDS = Object.keys(patientSchema.shape)
