import { Router } from 'express';
import { getAllCurrencies } from '../controllers/currencies.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.get('/', [], validation, getAllCurrencies);

export default router;
