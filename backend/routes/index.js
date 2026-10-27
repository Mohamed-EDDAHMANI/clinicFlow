import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import patientRoutes from './patientRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';



router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/audit-logs', auditLogRoutes);


export default router;
