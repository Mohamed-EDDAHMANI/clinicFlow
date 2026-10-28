import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Saisissez votre adresse email.').pipe(z.email('Adresse email invalide, par exemple nom@clinique.ma.')),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
})
