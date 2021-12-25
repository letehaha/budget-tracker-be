import { Router } from 'express';
import { getTransactionTypes } from '../controllers/transaction-types.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.get('/', [], validation, getTransactionTypes);

export default router;
