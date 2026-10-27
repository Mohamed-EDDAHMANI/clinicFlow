import { ROLES } from '../config/permissions.js';
import userModel from '../models/userModel.js';
import AppError from '../utils/AppError.js';

const getAll = () => userModel.getAllUsers();

const getById = async (id) => {
    const user = await userModel.findPublicById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

const create = ({ name, email, password, role = ROLES.STAFF }) => {
    return userModel.createUser({ name, email, password, role });
};

export default {
    getAll,
    getById,
    create
};
