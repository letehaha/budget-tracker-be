import { Router } from 'express';
import { getAccountBalanceHistory } from '@controllers/stats.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/account-balance/:id', authenticateJwt, getAccountBalanceHistory);

export default router;
