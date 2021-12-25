import { Router } from 'express';
import passport from 'passport';
import { getCategories } from '../controllers/categories.controller';

const router = Router({});

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  getCategories,
);

export default router;
