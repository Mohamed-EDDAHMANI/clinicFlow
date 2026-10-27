import express from 'express';
const router = express.Router();

import patientController from '../controllers/patientController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createPatientSchema, listPatientsQuerySchema } from '../validations/patientValidation.js';


router.post('/', authenticate, authorize('PATIENT_CREATE'), validate(createPatientSchema), patientController.createPatient);
router.get('/', authenticate, authorize('PATIENT_GETALL'), validate(listPatientsQuerySchema, 'query'), patientController.getPatients);

export default router;
