import patientModel from '../models/patientModel.js';

const create = (data) => patientModel.create(data);

const getAll = async ({ search, page, limit }) => {
    const { patients, total } = await patientModel.findAll({ search, limit, offset: (page - 1) * limit });

    return {
        patients,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

export default {
    create,
    getAll
};
