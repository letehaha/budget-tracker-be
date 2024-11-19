import { Router } from 'express';
import {
  getExchangeRatesForDate,
  getExchangeRatesForDateSchema,
} from '@controllers/exchange-rates/rates-for-date.controller';
import { validateEndpoint } from '@middlewares/validations';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get(
  '/:date',
  authenticateJwt,
  validateEndpoint(getExchangeRatesForDateSchema),
  getExchangeRatesForDate,
);

export default router;
