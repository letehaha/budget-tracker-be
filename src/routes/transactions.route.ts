import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  getTransactionsByTransferId,
  createTransaction,
  updateTransaction,
  unlinkTransferTransactions,
  linkTransactions,
  deleteTransaction,
} from '@controllers/transactions.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, getTransactions);
router.get('/:id', authenticateJwt, getTransactionById);
router.get(
  '/transfer/:transferId',
  authenticateJwt,
  getTransactionsByTransferId,
);
router.post('/', authenticateJwt, createTransaction);
router.put('/unlink', authenticateJwt, unlinkTransferTransactions);
router.put('/link', authenticateJwt, linkTransactions);
router.put('/:id', authenticateJwt, updateTransaction);
router.delete('/:id', authenticateJwt, deleteTransaction);

export default router;
