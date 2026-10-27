import patientModel from '../models/patientModel.js';
import AppError from '../utils/AppError.js';

const create = (data) => patientModel.create(data);

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

const update = async (id, data) => {
    const patient = await patientModel.update(id, data);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }
    return patient;
};

const remove = async (id) => {
    const deleted = await patientModel.softDelete(id);
    if (!deleted) {
        throw new AppError('Patient not found', 404);
    }
};

export default {
    create,
    getAll,
    getById,
    update,
    remove
};
