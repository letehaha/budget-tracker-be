import { Router } from 'express';
import { getPaymentTypes } from '../controllers/payment-types.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.get('/', [], validation, getPaymentTypes);

export default router;
