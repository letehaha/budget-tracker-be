import { Router } from 'express';
import {
  pairAccount,
  getUser,
  updateUser,
  getTransactions,
  getAccounts,
  createAccounts,
  monobankWebhook,
  updateWebhook,
  loadTransactions,
  updateAccount,
  refreshAccounts,
  updateTransaction,
} from '../../controllers/banks/monobank.controller';
import { authenticateJwt } from '../../middlewares/passport';

const router = Router({});

router.post('/pair-user', authenticateJwt, pairAccount);
router.get('/user', authenticateJwt, getUser);
router.post('/user', authenticateJwt, updateUser);
router.get('/transactions', authenticateJwt, getTransactions);
router.post('/transaction', authenticateJwt, updateTransaction);
router.get('/accounts', authenticateJwt, getAccounts);
router.post('/account', authenticateJwt, updateAccount);
router.post('/select-accounts', authenticateJwt, createAccounts);
router.post('/update-webhook', authenticateJwt, updateWebhook);
router.get('/load-transactions', authenticateJwt, loadTransactions);
router.get('/refresh-accounts', authenticateJwt, refreshAccounts);

router.post('/webhook', monobankWebhook);

export default router;
