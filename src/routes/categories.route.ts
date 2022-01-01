import { Router } from 'express';
import { getCategories } from '../controllers/categories.controller';
import { authenticateJwt } from '../middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, getCategories);

export default router;
