import { Router } from 'express';
import {
  getUser,
  getUserCurrencies,
  getUserBaseCurrency,
  addUserCurrencies,
  editUserCurrency,
  deleteUserCurrency,
  setBaseUserCurrency,
  updateUser,
  deleteUser,
} from '@controllers/user.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, getUser);
router.put('/update', authenticateJwt, updateUser);
router.delete('/delete', authenticateJwt, deleteUser);

router.get('/currencies', authenticateJwt, getUserCurrencies);
router.get('/currencies/base', authenticateJwt, getUserBaseCurrency);
router.post('/currencies', authenticateJwt, addUserCurrencies);
router.post('/currencies/base', authenticateJwt, setBaseUserCurrency);
router.put('/currency', authenticateJwt, editUserCurrency);
// Temporary disabled
// router.put('/currency/default', authenticateJwt, setDefaultUserCurrency);
router.delete('/currency', authenticateJwt, deleteUserCurrency);

export default router;
