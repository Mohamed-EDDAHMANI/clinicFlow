import express from 'express';
const router = express.Router();

import dashboardController from '../controllers/dashboardController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';


router.get('/stats', authenticate, authorize('DASHBOARD_VIEW'), dashboardController.getStats);

export default router;
