import { Router } from 'express';
import { API_RESPONSE_STATUS } from 'shared-types';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';
// import { marketDataService } from '@services/investments/market-data.service';

import { checkSecuritiesSyncingStatus } from '@controllers/investments/securities/check-syncing-status';
import { syncSecuritiesData } from '@controllers/investments/securities/sync-data';
import { loadSecuritiesList } from '@services/investments/securities/get-securities-list';
import { getInvestmentTransactions } from '@services/investments/transactions';
import {
  createInvestmentTransaction,
  createInvestmentTransactionSchema,
} from '@controllers/investments/transactions/create-transaction';

import { createHolding, loadHoldings } from '@controllers/investments/holdings';

const router = Router({});

/**
 * Holdings CRUD
 */
router.get('/holdings', authenticateJwt, loadHoldings);
router.post('/holdings', authenticateJwt, createHolding);

router.post(
  '/transaction',
  authenticateJwt,
  validateEndpoint(createInvestmentTransactionSchema),
  createInvestmentTransaction,
);

router.get('/transactions', authenticateJwt, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: userId } = req.user as any;
  const { accountId, securityId } = req.query as {
    accountId: string;
    securityId: string;
  };

  const data = await getInvestmentTransactions({
    userId,
    securityId: parseFloat(securityId),
    accountId: parseFloat(accountId),
  });

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
router.get('/securities/sync', authenticateJwt, syncSecuritiesData);
router.get('/securities/sync-status', authenticateJwt, checkSecuritiesSyncingStatus);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/securities/:query?', async (req: any, res) => {
  const { query } = req.query;
  const data = await loadSecuritiesList({ query });

  return res.status(200).json({
    status: API_RESPONSE_STATUS.success,
    response: data,
  });
});

// We have `syncSecuritiesData`
// router.get('/securities/prices', async (req, res) => {
//   const data = await syncSecuritiesPricing();

//   return res.status(200).json({
//     status: API_RESPONSE_STATUS.success,
//     response: data,
//   });
// });
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
