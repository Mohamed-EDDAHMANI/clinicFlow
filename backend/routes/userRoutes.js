import express from 'express';
const router = express.Router();

import userController from '../controllers/userController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createUserSchema } from '../validations/userValidation.js';


router.get('/me', authenticate, userController.getMe);
router.get('/getAll', authenticate, authorize('USER_GETALL'), userController.getAllUsers);
router.post('/create', authenticate, authorize('USER_CREATE'), validate(createUserSchema), userController.createUser);

export default router;
