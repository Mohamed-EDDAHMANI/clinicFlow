import express from 'express';
const router = express.Router();

import patientController from '../controllers/patientController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
    createPatientSchema,
    updatePatientSchema,
    patientIdParamSchema,
    listPatientsQuerySchema,
} from '../validations/patientValidation.js';

const validateId = validate(patientIdParamSchema, 'params');


router.post('/', authenticate, authorize('PATIENT_CREATE'), validate(createPatientSchema), patientController.createPatient);
router.get('/', authenticate, authorize('PATIENT_GETALL'), validate(listPatientsQuerySchema, 'query'), patientController.getPatients);
router.get('/:id', authenticate, authorize('PATIENT_GET'), validateId, patientController.getPatient);
router.put('/:id', authenticate, authorize('PATIENT_UPDATE'), validateId, validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', authenticate, authorize('PATIENT_DELETE'), validateId, patientController.deletePatient);

export default router;
