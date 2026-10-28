import { z } from 'zod';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];

const status = z.enum(APPOINTMENT_STATUSES);

export const createAppointmentSchema = z.object({
    patient_id: z.uuid('Invalid patient id'),
    appointment_date: z.iso.datetime({ offset: true, local: true, message: 'Appointment date must be an ISO date with time' }),
    status: status.default('pending'),
    reason: z.string().trim().min(2, 'Reason must be at least 2 characters').max(255),
    notes: z.string().trim().max(1000).nullish(),
});

export const listAppointmentsQuerySchema = z.object({
    date: z.iso.date('Date must be a valid date (YYYY-MM-DD)').optional(),
    status: status.optional(),
});

export const updateAppointmentStatusSchema = z.object({
    status,
});

export const appointmentIdParamSchema = z.object({
    id: z.uuid('Invalid appointment id'),
});
