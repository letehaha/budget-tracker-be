import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import { syncExchangeRates } from '@services/exchange-rates/sync-exchange-rates';
import { API_RESPONSE_STATUS } from 'shared-types';
import { errorHandler } from '@controllers/helpers';

const router = Router();

router.get('/exchange-rates/sync', authenticateJwt, async (req, res) => {
  try {
    await syncExchangeRates();

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
});

export default router;
