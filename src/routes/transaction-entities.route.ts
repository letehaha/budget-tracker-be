import { Router } from 'express';
import { getTransactionEntities } from '../controllers/transaction-entities.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.get('/', [], validation, getTransactionEntities);

export default router;
