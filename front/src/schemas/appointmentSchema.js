import { z } from 'zod'
import { clinicToday, isPast } from '../utils/format'

const appointmentFields = z.object({
  patient_id: z.string().min(1, 'Choisissez le patient concerné.'),
  date: z.string()
    .min(1, 'Choisissez la date du rendez-vous.')
    .refine((date) => date >= clinicToday(), 'La date ne peut pas être dans le passé.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez l'heure du rendez-vous."),
  reason: z.string().trim()
    .min(2, 'Indiquez le motif de la consultation (2 caractères minimum).')
    .max(255, 'Le motif ne doit pas dépasser 255 caractères.'),
  status: z.enum(['pending', 'confirmed']),
  notes: z.string().trim()
    .max(1000, 'Les notes ne doivent pas dépasser 1000 caractères.')
    .transform((value) => value || null),
})

export const appointmentSchema = appointmentFields.refine(
  ({ date, time }) => !(date === clinicToday() && /^\d{2}:\d{2}$/.test(time) && isPast(date, time)),
  { message: 'Cet horaire est déjà passé.', path: ['time'] },
)

export const APPOINTMENT_FIELDS = Object.keys(appointmentFields.shape)

export const toAppointmentPayload = ({ date, time, ...appointment }) => ({
  ...appointment,
  appointment_date: `${date}T${time}`,
})
