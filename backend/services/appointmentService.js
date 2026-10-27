import appointmentModel from '../models/appointmentModel.js';
import patientModel from '../models/patientModel.js';
import auditLogService, { AUDIT_ACTIONS, AUDIT_ENTITIES } from './auditLogService.js';
import AppError from '../utils/AppError.js';

const create = async (data, userId) => {
    const patient = await patientModel.findById(data.patient_id);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }

    const appointment = await appointmentModel.create({ ...data, created_by: userId });

    await auditLogService.log({
        userId,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITIES.APPOINTMENT,
        entityId: appointment.id,
        newValues: appointment,
    });

    return appointment;
};

const getAll = (filters) => appointmentModel.findAll(filters);

const updateStatus = async (id, status, userId) => {
    const oldAppointment = await appointmentModel.findById(id);
    if (!oldAppointment) {
        throw new AppError('Appointment not found', 404);
    }

    const appointment = await appointmentModel.updateStatus(id, status);
    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    await auditLogService.log({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITIES.APPOINTMENT,
        entityId: id,
        oldValues: { status: oldAppointment.status },
        newValues: { status: appointment.status },
    });

    return appointment;
};

export default {
    create,
    getAll,
    updateStatus
};
