import { ROLES } from '../config/permissions.js';
import userModel from '../models/userModel.js';
import auditLogService, { AUDIT_ACTIONS, AUDIT_ENTITIES } from './auditLogService.js';
import AppError from '../utils/AppError.js';

const getAll = () => userModel.getAllUsers();

const getById = async (id) => {
    const user = await userModel.findPublicById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

const create = async ({ name, email, password, role = ROLES.STAFF }, userId) => {
    const id = await userModel.createUser({ name, email, password, role });

    await auditLogService.log({
        userId,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITIES.USER,
        entityId: id,
        newValues: { full_name: name, email, role },
    });

    return id;
};

export default {
    getAll,
    getById,
    create
};
