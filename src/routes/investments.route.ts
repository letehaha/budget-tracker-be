import { Router } from 'express';
// import { marketDataService } from '@services/investments/market-data.service';
import { syncSecuritiesList } from '@services/investments/securities.service';

const router = Router({});

// get all holdings
router.get('/holdings');
// create a new holding
router.post('/holdings');

// get holding by id
router.get('/holdings/:id');
// update holding
router.put('/holdings/:id');
// delete holding
router.delete('/holdings/:id');

router.get('/securities/sync', async (req, res) => {
  const data = await syncSecuritiesList();

  return res.status(200).json(data);
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
