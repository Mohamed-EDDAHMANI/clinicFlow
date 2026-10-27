import express from 'express';
const router = express.Router();

import authController from '../controllers/authController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';
import { loginSchema } from '../validations/authValidation.js';

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh, authController.clearRefreshCookieOnError);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
