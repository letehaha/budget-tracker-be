import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@controllers/accounts.controller';

const router = Router({});

router.get('/', authenticateJwt, getAccounts);
router.get('/:id', authenticateJwt, getAccountById);
router.post('/', authenticateJwt, createAccount);
router.put('/:id', authenticateJwt, updateAccount);
router.delete('/:id', authenticateJwt, deleteAccount);

export default router;
