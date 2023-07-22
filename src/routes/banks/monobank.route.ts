import { Router } from 'express';
import {
  pairAccount,
  getUser,
  updateUser,
  loadTransactions,
  refreshAccounts,
} from '@controllers/banks/monobank.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.post('/pair-user', authenticateJwt, pairAccount);
router.get('/user', authenticateJwt, getUser);
router.post('/user', authenticateJwt, updateUser);
router.get('/load-transactions', authenticateJwt, loadTransactions);
router.get('/refresh-accounts', authenticateJwt, refreshAccounts);

export default router;
