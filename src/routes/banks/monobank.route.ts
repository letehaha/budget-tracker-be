import { Router } from 'express';
import passport from 'passport';
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

const router = Router({});

router.post(
  '/pair-user',
  passport.authenticate('jwt', { session: false }),
  pairAccount,
);
router.get(
  '/user',
  passport.authenticate('jwt', { session: false }),
  getUser,
);
router.post(
  '/user',
  passport.authenticate('jwt', { session: false }),
  updateUser,
);
router.get(
  '/transactions',
  passport.authenticate('jwt', { session: false }),
  getTransactions,
);
router.post(
  '/transaction',
  passport.authenticate('jwt', { session: false }),
  updateTransaction,
);
router.get(
  '/accounts',
  passport.authenticate('jwt', { session: false }),
  getAccounts,
);
router.post(
  '/account',
  passport.authenticate('jwt', { session: false }),
  updateAccount,
);
router.post(
  '/select-accounts',
  passport.authenticate('jwt', { session: false }),
  createAccounts,
);
router.post(
  '/webhook',
  monobankWebhook,
);
router.post(
  '/update-webhook',
  passport.authenticate('jwt', { session: false }),
  updateWebhook,
);
router.get(
  '/load-transactions',
  passport.authenticate('jwt', { session: false }),
  loadTransactions,
);
router.get(
  '/refresh-accounts',
  passport.authenticate('jwt', { session: false }),
  refreshAccounts,
);

export default router;
