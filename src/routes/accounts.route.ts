import { Router } from 'express';
import passport from 'passport';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/accounts.controller';

const router = Router({});

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getAccounts,
);
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getAccountById,
);
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createAccount,
);
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  updateAccount,
);
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  deleteAccount,
);

export default router;
