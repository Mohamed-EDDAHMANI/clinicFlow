import patientService from '../services/patientService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const createPatient = async (req, res) => {
    const patient = await patientService.create(req.body);
    sendSuccess(res, patient, 'Patient created successfully', 201);
};

const getPatients = async (req, res) => {
    const { patients, meta } = await patientService.getAll(req.query);
    sendSuccess(res, patients, 'Patients fetched successfully', 200, meta);
};

export default {
    createPatient,
    getPatients
};
