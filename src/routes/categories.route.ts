import { Router } from 'express';
import * as categoriesController from '@controllers/categories.controller';
import {
  createCategory,
  createCategorySchema,
} from '@controllers/categories.controller/create-category';
import {
  updateCategorySchema,
  editCategory,
} from '@controllers/categories.controller/update-category';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';

const router = Router({});

router.get('/', authenticateJwt, categoriesController.getCategories);
router.post('/', authenticateJwt, validateEndpoint(createCategorySchema), createCategory);
router.put('/:id', authenticateJwt, validateEndpoint(updateCategorySchema), editCategory);
router.delete('/:id', authenticateJwt, categoriesController.deleteCategory);

export default router;
