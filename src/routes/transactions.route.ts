import { Router } from 'express';
import passport from 'passport';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactions.controller';

const router = Router({});

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getTransactions,
);
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getTransactionById,
);
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createTransaction,
);
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  updateTransaction,
);
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  deleteTransaction,
);

export default router;
