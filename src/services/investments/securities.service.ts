import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import { logger } from '@js/utils';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import Securities, {
  SECURITY_PROVIDER,
  ASSET_CLASS,
} from '@models/investments/Security.model';
import chunk from 'lodash/chunk';
import { marketDataService } from './market-data.service';

// import tickersMock from './mocks/tickers-mock.json';

export const syncSecuritiesList = async ({
  transaction,
}: GenericSequelizeModelAttributes = {}) => {
  if (!process.env.POLYGON_API_KEY) {
    logger.warn('No Polygon API key found, skipping sync');
    return;
  }

  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const startProfiling = new Date();
    logger.info(
      `Started syncing stock tickers. ${startProfiling.toISOString()}`,
    );

    const tickers = await marketDataService.getUSStockTickers();
    // const tickers = tickersMock;

    const endProfiling = new Date();

    logger.info(`
      Finished LOADING stock tickers: ${endProfiling.toISOString()}.
      Minutes took: ${differenceInMinutes(endProfiling, startProfiling)}.
      Seconds took: ${differenceInSeconds(endProfiling, startProfiling)}.
      Records loaded: ${tickers.length}.
    `);

    if (!tickers.length) return;

    for (const chunkedData of chunk(tickers, 500)) {
      await Securities.bulkCreate(
        chunkedData.map((item) => ({
          name: item.name,
          symbol: item.ticker,
          currencyCode: item.currency_name?.toUpperCase(),
          exchangeAcronym: item.exchangeAcronym,
          exchangeMic: item.exchangeMic,
          exchangeName: item.exchangeName,
          providerName: SECURITY_PROVIDER.polygon,
          assetClass: ASSET_CLASS.stocks,
          updatedAt: new Date(),
        })),
        {
          updateOnDuplicate: [
            'name',
            'currencyCode',
            'currencyCode',
            'exchangeAcronym',
            'exchangeName',
            'updatedAt',
          ],
          transaction,
        },
      );
    }

    logger.info(`
      Finished SYNCING stock tickers: ${endProfiling.toISOString()}.
      Minutes took: ${differenceInMinutes(endProfiling, startProfiling)}.
      Seconds took: ${differenceInSeconds(endProfiling, startProfiling)}.
    `);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return tickers;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};
