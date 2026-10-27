import appointmentModel from '../models/appointmentModel.js';
import patientModel from '../models/patientModel.js';
import AppError from '../utils/AppError.js';

const create = async (data, userId) => {
    const patient = await patientModel.findById(data.patient_id);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }

    return appointmentModel.create({ ...data, created_by: userId });
};

const getAll = (filters) => appointmentModel.findAll(filters);

const updateStatus = async (id, status) => {
    const appointment = await appointmentModel.updateStatus(id, status);
    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }
    return appointment;
};

export default {
    create,
    getAll,
    updateStatus
};
