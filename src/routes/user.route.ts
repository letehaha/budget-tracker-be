import { Router } from 'express';
import {
  getUser,
  getUserCurrencies,
  getUserBaseCurrency,
  editUserCurrency,
  deleteUserCurrency,
  setBaseUserCurrency,
  getCurrenciesExchangeRates,
  updateUser,
  deleteUser,
  removeUserCurrencyExchangeRate,
} from '@controllers/user.controller';
import {
  editCurrencyExchangeRate,
  editCurrencyExchangeRateSchema,
} from '@controllers/currencies/edit-currency-exchange-rate';
import {
  addUserCurrencies,
  addUserCurrenciesSchema,
} from '@controllers/currencies/add-user-currencies';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';

const router = Router({});

router.get('/', authenticateJwt, getUser);
router.put('/update', authenticateJwt, updateUser);
router.delete('/delete', authenticateJwt, deleteUser);

router.get('/currencies', authenticateJwt, getUserCurrencies);
router.get('/currencies/base', authenticateJwt, getUserBaseCurrency);
router.get('/currencies/rates', authenticateJwt, getCurrenciesExchangeRates);

router.post(
  '/currencies',
  authenticateJwt,
  validateEndpoint(addUserCurrenciesSchema),
  addUserCurrencies,
);
router.post('/currencies/base', authenticateJwt, setBaseUserCurrency);

router.put('/currency', authenticateJwt, editUserCurrency);
router.put(
  '/currency/rates',
  authenticateJwt,
  validateEndpoint(editCurrencyExchangeRateSchema),
  editCurrencyExchangeRate,
);

router.delete('/currency', authenticateJwt, deleteUserCurrency);
router.delete('/currency/rates', authenticateJwt, removeUserCurrencyExchangeRate);

export default router;
