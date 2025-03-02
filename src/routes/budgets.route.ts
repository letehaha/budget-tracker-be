import { Router } from 'express';
import { getBudgets } from '@controllers/budgets/get-budgets';
// import { deleteCategory, deleteCategorySchema } from '@controllers/categories.controller/delete-category';
import { createBudget, createBudgetSchema } from '@controllers/budgets/create-budget';
// import { updateCategorySchema, editCategory } from '@controllers/categories.controller/update-category';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';

const router = Router({});

router.get('/')

router.get('/', authenticateJwt, getBudgets);
router.post('/', authenticateJwt, validateEndpoint(createBudgetSchema), createBudget);
// router.put('/:id', authenticateJwt, validateEndpoint(updateCategorySchema), editCategory);
// router.delete('/:id', authenticateJwt, validateEndpoint(deleteCategorySchema), deleteCategory);

export default router;
