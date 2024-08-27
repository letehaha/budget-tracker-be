import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import { login, register, validateToken } from '@controllers/auth.controller';

const router = Router({});

router.get('/validate-token', authenticateJwt, validateToken);
router.post('/login', [], login);
router.post('/register', [], register);

export default router;
