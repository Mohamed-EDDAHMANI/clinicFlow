import express from 'express';
const router = express.Router();

import auditLogController from '../controllers/auditLogController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { listAuditLogsQuerySchema } from '../validations/auditLogValidation.js';


router.get('/', authenticate, authorize('AUDIT_LOG_GETALL'), validate(listAuditLogsQuerySchema, 'query'), auditLogController.getAuditLogs);

export default router;
