import { Router } from 'express';
import { getBudgets } from '@controllers/budgets/get-budgets';
import { createBudget, createBudgetSchema } from '@controllers/budgets/create-budget';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';
import { deleteBudget, deleteBudgetSchema } from '@controllers/budgets/delete-budgets';

const router = Router({});

router.get('/')

router.get('/', authenticateJwt, getBudgets);
router.post('/', authenticateJwt, validateEndpoint(createBudgetSchema), createBudget);
// router.put('/:id', authenticateJwt, validateEndpoint(updateCategorySchema), editCategory);
router.delete('/:id', authenticateJwt, validateEndpoint(deleteBudgetSchema), deleteBudget);

export default router;
