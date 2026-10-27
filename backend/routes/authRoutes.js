import express from 'express';
const router = express.Router();

import authController from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { loginSchema, registerSchema } from '../validations/authValidation.js';

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh', authController.refresh, authController.clearRefreshCookieOnError);
router.post('/logout', authController.logout);

export default router;
