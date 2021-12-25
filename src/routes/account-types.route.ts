import { Router } from 'express';
import { getAccountTypes } from '../controllers/account-types.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.get('/', [], validation, getAccountTypes);

export default router;
