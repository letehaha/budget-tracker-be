import { Router } from 'express';
import { getBalanceHistory } from '@controllers/stats.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/balance-history', authenticateJwt, getBalanceHistory);

export default router;
