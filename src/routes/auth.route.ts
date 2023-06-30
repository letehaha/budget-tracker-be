import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import {
  login,
  register,
  validateToken,
} from '@controllers/auth.controller';
import validation from '@middlewares/validations';

const router = Router({});

router.get('/validate-token', authenticateJwt, validateToken)
router.post('/login', [], validation, login);
router.post('/register', [], validation, register);

export default router;
