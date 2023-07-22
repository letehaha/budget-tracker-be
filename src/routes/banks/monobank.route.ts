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
// TODO: in transactions service limit what data might be edited for external txs
// router.post('/transaction', authenticateJwt, updateTransaction);
router.get('/load-transactions', authenticateJwt, loadTransactions);
router.get('/refresh-accounts', authenticateJwt, refreshAccounts);

export default router;
