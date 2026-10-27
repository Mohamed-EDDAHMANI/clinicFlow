import patientService from '../services/patientService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const createPatient = async (req, res) => {
    const patient = await patientService.create(req.body, req.user.id);
    sendSuccess(res, patient, 'Patient created successfully', 201);
};

const getPatients = async (req, res) => {
    const { patients, meta } = await patientService.getAll(req.query);
    sendSuccess(res, patients, 'Patients fetched successfully', 200, meta);
};

const getPatient = async (req, res) => {
    const patient = await patientService.getById(req.params.id);
    sendSuccess(res, patient, 'Patient fetched successfully');
};

const updatePatient = async (req, res) => {
    const patient = await patientService.update(req.params.id, req.body, req.user.id);
    sendSuccess(res, patient, 'Patient updated successfully');
};

const deletePatient = async (req, res) => {
    await patientService.remove(req.params.id, req.user.id);
    sendSuccess(res, null, 'Patient deleted successfully');
};

export default {
    createPatient,
    getPatients,
    getPatient,
    updatePatient,
    deletePatient
};
