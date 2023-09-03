import { Router } from 'express';
import * as categoriesController from '@controllers/categories.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, categoriesController.getCategories);
router.put('/:id', authenticateJwt, categoriesController.editCategory);

export default router;
