import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import patientRoutes from './patientRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';



router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);


export default router;
