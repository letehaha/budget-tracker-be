import { Router } from 'express';
import * as statsController from '@controllers/stats.controller';
import { authenticateJwt } from '@middlewares/passport';

const router = Router({});

router.get('/balance-history', authenticateJwt, statsController.getBalanceHistory);
// TODO: router.get('/balance-history/:account-id', authenticateJwt, statsController.getBalanceHistoryForAccount);
router.get('/total-balance', authenticateJwt, statsController.getTotalBalance);

export default router;
