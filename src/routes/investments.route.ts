import { Router } from 'express';
import { API_RESPONSE_STATUS } from 'shared-types';
import { authenticateJwt } from '@middlewares/passport';
// import { marketDataService } from '@services/investments/market-data.service';
import {
  syncSecuritiesList,
  loadSecuritiesList,
  syncSecuritiesPricing,
} from '@services/investments/securities.service';

import {
  loadHoldingsList,
  addHolding,
} from '@services/investments/holdings.service';

const router = Router({});

// get all holdings
router.get('/holdings', authenticateJwt, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: userId } = req.user as any;
  const data = await loadHoldingsList({ userId });

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});
// create a new holding
router.post('/holdings', authenticateJwt, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: userId } = req.user as any;
  const { accountId, securityId } = req.body;
  const data = await addHolding({ userId, accountId, securityId });

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});

// get holding by id
// router.get('/holdings/:id');
// update holding
// router.put('/holdings/:id');
// delete holding
// router.delete('/holdings/:id');

// curl http://127.0.0.1:8081/api/v1/investing/securities/sync
router.get('/securities/sync', async (req, res) => {
  const data = await syncSecuritiesList();

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});
router.get('/securities', async (req, res) => {
  const data = await loadSecuritiesList();

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});
router.get('/securities/prices', async (req, res) => {
  const data = await syncSecuritiesPricing();

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});
// get marked data. for example ?asset_class=crypto|stocks|etc & ticker= & symbol= & etc
// so client can use it to fetch data for input field when user tries to add
// holdings
// router.get('/market-data', async (req, res) => {
//   const { asset_class, ticker, symbol } = req.query;

//   const data = [];

//   if (symbol) {
//     data = await marketDataService.getExchangesList();
//   }

//   return res.status(200).json(data);
// });

export default router;
