import {
  SECURITY_PROVIDER,
  ASSET_CLASS,
  SecurityModel,
  SecurityPricingModel,
} from 'shared-types';
import {
  differenceInMinutes,
  differenceInSeconds,
  format,
  subDays,
} from 'date-fns';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import { Op, literal, type Order } from 'sequelize';
import { logger } from '@js/utils';
import Securities from '@models/investments/Security.model';
import SecurityPricing from '@models/investments/SecurityPricing.model';
import chunk from 'lodash/chunk';
import { marketDataService, type TickersResponse } from './market-data.service';

import tickersMock from './mocks/tickers-mock.json';
import type { IAggs } from '@polygon.io/client-js';
import tickersPricesMock from './mocks/tickers-prices-mock.json';

export async function loadSecuritiesList<T extends keyof SecurityModel>(
  { attributes, query }: { attributes?: T[]; query?: string } = {},
  { transaction }: GenericSequelizeModelAttributes = {},
): Promise<Pick<SecurityModel, T>[]> {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  let where: Record<string, unknown> = {};
  let order: Order | undefined = undefined;

  if (query) {
    where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { symbol: { [Op.iLike]: `%${query}%` } },
      ],
    };
    order = [
      [
        literal(
          `CASE
            WHEN "symbol" = '${query}' THEN 1
            WHEN "name" = '${query}' THEN 2
            WHEN "symbol" ILIKE '${query}%' THEN 3
            WHEN "name" ILIKE '${query}%' THEN 4
            ELSE 5
          END`,
        ),
        'ASC',
      ],
      ['name', 'ASC'],
      ['symbol', 'ASC'],
    ];
  }

  try {
    const securities = (await Securities.findAll({
      transaction,
      where,
      order,
      attributes,
    })) as Pick<SecurityModel, T>[];

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return securities;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
}

export const syncSecuritiesData = async ({
  transaction,
}: GenericSequelizeModelAttributes = {}) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    logger.info('Started syncing all securities data.');

    await syncSecuritiesList({ transaction });

    logger.info('Started syncing all securities prices data.');

    await syncSecuritiesPricing({ transaction });

    logger.info('Finished syncing all securities data.');

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};

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

    let tickers: TickersResponse = [];
    if (process.env.NODE_ENV === 'test') {
      tickers = tickersMock as TickersResponse;
    } else {
      tickers = await marketDataService.getUSStockTickers();
    }

    const endProfiling = new Date();

    logger.info(`
      Finished LOADING stock tickers: ${endProfiling.toISOString()}.
      Minutes took: ${differenceInMinutes(endProfiling, startProfiling)}.
      Seconds took: ${differenceInSeconds(endProfiling, startProfiling)}.
      Records loaded: ${tickers.length}.
    `);

    if (!tickers.length) return;

    let counter = 0;
    for (const chunkedData of chunk(tickers, 1)) {
      counter++;
      try {
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
          })) as SecurityModel[],
          {
            conflictAttributes: ['symbol', 'exchangeMic'],
            updateOnDuplicate: [
              'name',
              'currencyCode',
              'exchangeAcronym',
              'exchangeName',
              'updatedAt',
            ],
            transaction,
          },
        );
      } catch (err) {
        logger.info(`
          Chuncked metadata:

          chunk number: ${counter}
          length: ${chunkedData.length}
          uniqueTickers: ${chunkedData.map((item) => item.ticker).length}
          uniqueMisc: ${chunkedData.map((item) => item.exchangeMic).length}
          uniqueValuesLength: ${
            new Set(
              chunkedData.map((item) => `${item.ticker}-${item.exchangeMic}`),
            ).size
          }
          uniqueValues: ${[
            ...new Set(
              chunkedData.map((item) => `${item.ticker}-${item.exchangeMic}`),
            ),
          ]}
        `);
        throw err;
      }
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

export const syncSecuritiesPricing = async ({
  transaction,
}: GenericSequelizeModelAttributes = {}) => {
  if (!process.env.POLYGON_API_KEY) {
    logger.warn('No polygon API key found, skipping sync');
    return;
  }

  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    let dailyPrices: IAggs;

    const startProfiling = new Date();
    logger.info(
      `Started syncing stock tickers prices. ${startProfiling.toISOString()}`,
    );

    if (process.env.NODE_ENV === 'test') {
      dailyPrices = tickersPricesMock as unknown as IAggs;
    } else {
      const date = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      dailyPrices = await marketDataService.getAllDailyPricing({ date });
    }

    const endProfiling = new Date();

    logger.info(`
      Finished LOADING stock tickers prices: ${endProfiling.toISOString()}.
      Minutes took: ${differenceInMinutes(endProfiling, startProfiling)}.
      Seconds took: ${differenceInSeconds(endProfiling, startProfiling)}.
      Records loaded: ${dailyPrices.results.length}.
    `);

    const securities = await loadSecuritiesList(
      { attributes: ['assetClass', 'id', 'symbol', 'currencyCode'] },
      { transaction },
    );

    const prices = await marketDataService.getEndOfDayPricing(
      securities,
      dailyPrices,
    );

    const result = [];

    for (const chunkedData of chunk(prices, 500)) {
      const data: Omit<
        SecurityPricingModel,
        'updatedAt' | 'createdAt' | 'security'
      >[] = chunkedData.map((item) => ({
        securityId: item.security.id,
        date: new Date(item.pricing.updatedAt),
        priceClose: String(item.pricing.price),
        priceAsOf: new Date(item.pricing.updatedAt),
        source: marketDataService.source,
      }));

      result.push(...data);

      await SecurityPricing.bulkCreate(data, {
        updateOnDuplicate: ['priceClose', 'priceAsOf', 'updatedAt', 'source'],
        transaction,
      });
    }

    // TODO: update balances

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};
