import { Router } from 'express';
import passport from 'passport';
import {
  getUser,
  getUserCurrencies,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';

const router = Router({});

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getUser,
);
router.get(
  '/currencies',
  passport.authenticate('jwt', { session: false }),
  getUserCurrencies,
);
router.put(
  '/update',
  passport.authenticate('jwt', { session: false }),
  updateUser,
);
router.delete(
  '/delete',
  passport.authenticate('jwt', { session: false }),
  deleteUser,
);

export default router;
