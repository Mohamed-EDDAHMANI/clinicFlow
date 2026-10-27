import patientModel from '../models/patientModel.js';
import auditLogService, { AUDIT_ACTIONS, AUDIT_ENTITIES } from './auditLogService.js';
import AppError from '../utils/AppError.js';

const logPatient = (userId, action, entityId, oldValues, newValues) =>
    auditLogService.log({ userId, action, entityType: AUDIT_ENTITIES.PATIENT, entityId, oldValues, newValues });

const create = async (data, userId) => {
    const patient = await patientModel.create(data);
    await logPatient(userId, AUDIT_ACTIONS.CREATE, patient.id, null, patient);
    return patient;
};

const getAll = async ({ search, page, limit }) => {
    const { patients, total } = await patientModel.findAll({ search, limit, offset: (page - 1) * limit });

    return {
        patients,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const getById = async (id) => {
    const patient = await patientModel.findById(id);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }
    return patient;
};

const update = async (id, data, userId) => {
    const oldPatient = await getById(id);
    const patient = await patientModel.update(id, data);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }

    await logPatient(userId, AUDIT_ACTIONS.UPDATE, id, oldPatient, patient);
    return patient;
};

const remove = async (id, userId) => {
    const oldPatient = await getById(id);
    const deleted = await patientModel.softDelete(id);
    if (!deleted) {
        throw new AppError('Patient not found', 404);
    }

    await logPatient(userId, AUDIT_ACTIONS.DELETE, id, oldPatient, null);
};

export default {
    create,
    getAll,
    getById,
    update,
    remove
};
