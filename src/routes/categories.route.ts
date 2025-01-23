import { Router } from 'express';
import { getCategories } from '@controllers/categories.controller/get-categories';
import { deleteCategory, deleteCategorySchema } from '@controllers/categories.controller/delete-category';
import { createCategory, createCategorySchema } from '@controllers/categories.controller/create-category';
import { updateCategorySchema, editCategory } from '@controllers/categories.controller/update-category';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';

const router = Router({});

router.get('/', authenticateJwt, getCategories);
router.post('/', authenticateJwt, validateEndpoint(createCategorySchema), createCategory);
router.put('/:id', authenticateJwt, validateEndpoint(updateCategorySchema), editCategory);
router.delete('/:id', authenticateJwt, validateEndpoint(deleteCategorySchema), deleteCategory);

export default router;
