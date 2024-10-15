import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import {
  getAccounts,
  getAccountById,
  getAccountByIdSchema,
  createAccount,
  createAccountSchema,
  updateAccount,
  updateAccountSchema,
  deleteAccount,
  deleteAccountSchema,
} from '@controllers/accounts';
import { validateEndpoint } from '@middlewares/validations';

const router = Router({});

router.get('/', authenticateJwt, getAccounts);
router.get('/:id', authenticateJwt, validateEndpoint(getAccountByIdSchema), getAccountById);
router.post('/', authenticateJwt, validateEndpoint(createAccountSchema), createAccount);
router.put('/:id', authenticateJwt, validateEndpoint(updateAccountSchema), updateAccount);
router.delete('/:id', authenticateJwt, validateEndpoint(deleteAccountSchema), deleteAccount);

export default router;
