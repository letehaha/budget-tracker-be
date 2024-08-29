import { Router } from 'express';
import { getAllCurrencies } from '@controllers/currencies.controller';

const router = Router({});

router.get('/', [], getAllCurrencies);

export default router;
