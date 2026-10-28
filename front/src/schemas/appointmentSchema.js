import { z } from 'zod'
import { localToday } from '../utils/format'

export const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Choisissez le patient concerné.'),
  date: z.string()
    .min(1, 'Choisissez la date du rendez-vous.')
    .refine((date) => date >= localToday(), 'La date ne peut pas être dans le passé.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez l'heure du rendez-vous."),
  reason: z.string().trim()
    .min(2, 'Indiquez le motif de la consultation (2 caractères minimum).')
    .max(255, 'Le motif ne doit pas dépasser 255 caractères.'),
  status: z.enum(['pending', 'confirmed']),
  notes: z.string().trim()
    .max(1000, 'Les notes ne doivent pas dépasser 1000 caractères.')
    .transform((value) => value || null),
})

export const APPOINTMENT_FIELDS = Object.keys(appointmentSchema.shape)

export const toAppointmentPayload = ({ date, time, ...appointment }) => ({
  ...appointment,
  appointment_date: `${date}T${time}`,
})
