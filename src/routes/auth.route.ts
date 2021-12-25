import { Router } from 'express';
import {
  login,
  register,
} from '../controllers/auth.controller';
import validation from '../middlewares/validations';

const router = Router({});

router.post('/login', [], validation, login);
router.post('/register', [], validation, register);

export default router;
