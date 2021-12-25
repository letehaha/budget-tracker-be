import { Router } from 'express';
import passport from 'passport';
import {
  getAccountData,
  setSettings,
} from '../../controllers/crypto/binance.controller';

const router = Router({});

router.get(
  '/account',
  passport.authenticate('jwt', { session: false }),
  getAccountData,
);
router.post(
  '/set-settings',
  passport.authenticate('jwt', { session: false }),
  setSettings,
);

export default router;
