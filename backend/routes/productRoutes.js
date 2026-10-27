import express from 'express';
const router = express.Router();

import productController from '../controllers/productController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createProductSchema, updateProductSchema, productIdSchema } from '../validations/productValidation.js';


router.get('/getAll', productController.getAllProducts);
router.get('/:id', validate(productIdSchema, 'params'), productController.getProductById);
router.post('/create', authenticate, authorize('PRODUCT_CREATE'), validate(createProductSchema), productController.createProduct);
router.patch('/update/:id', authenticate, authorize('PRODUCT_UPDATE'), validate(productIdSchema, 'params'), validate(updateProductSchema), productController.updateProduct);
router.delete('/delete/:id', authenticate, authorize('PRODUCT_DELETE'), validate(productIdSchema, 'params'), productController.deleteProduct);

export default router;
