import express from 'express';
const router = express.Router();

import appointmentController from '../controllers/appointmentController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
    createAppointmentSchema,
    listAppointmentsQuerySchema,
    updateAppointmentStatusSchema,
    appointmentIdParamSchema,
} from '../validations/appointmentValidation.js';


router.post('/', authenticate, authorize('APPOINTMENT_CREATE'), validate(createAppointmentSchema), appointmentController.createAppointment);
router.get('/', authenticate, authorize('APPOINTMENT_GETALL'), validate(listAppointmentsQuerySchema, 'query'), appointmentController.getAppointments);
router.patch('/:id/status', authenticate, authorize('APPOINTMENT_UPDATE_STATUS'), validate(appointmentIdParamSchema, 'params'), validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);

export default router;
