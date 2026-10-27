import auditLogModel from '../models/auditLogModel.js';

export const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
};

export const AUDIT_ENTITIES = {
    USER: 'users',
    PATIENT: 'patients',
    APPOINTMENT: 'appointments',
};

const log = ({ userId, action, entityType, entityId, oldValues, newValues }) =>
    auditLogModel.create({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
    });

const getAll = async ({ page, limit, ...filters }) => {
    const { logs, total } = await auditLogModel.findAll({ ...filters, limit, offset: (page - 1) * limit });

    return {
        logs,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

export default {
    log,
    getAll
};
