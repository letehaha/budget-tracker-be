import { Router } from 'express';
import {
  getUser,
  getUserCurrencies,
  addUserCurrencies,
  editUserCurrency,
  setDefaultUserCurrency,
  deleteUserCurrency,
  updateUser,
  deleteUser,
} from '@controllers/user.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, getUser);
router.put('/update', authenticateJwt, updateUser);
router.delete('/delete', authenticateJwt, deleteUser);

router.get('/currencies', authenticateJwt, getUserCurrencies);
router.post('/currencies', authenticateJwt, addUserCurrencies);
router.put('/currency', authenticateJwt, editUserCurrency);
router.put('/currency/default', authenticateJwt, setDefaultUserCurrency);
router.delete('/currency', authenticateJwt, deleteUserCurrency);

export default router;
