import { SECURITY_PROVIDER, ASSET_CLASS } from 'shared-types';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import { Op, literal, type Order } from 'sequelize';
import { logger } from '@js/utils';
import Securities, {
  SecurityAttributes,
} from '@models/investments/Security.model';
import SecurityPricing, {
  type SecurityPricingAttributes,
} from '@models/investments/SecurityPricing.model';
import chunk from 'lodash/chunk';
import { marketDataService, type TickersResponse } from './market-data.service';

import tickersMock from './mocks/tickers-mock.json';
import type { IAggs } from '@polygon.io/client-js';
import tickersPricesMock from './mocks/tickers-prices-mock.json';

export async function loadSecuritiesList<T extends keyof SecurityAttributes>(
  { attributes, query }: { attributes?: T[]; query?: string } = {},
  { transaction }: GenericSequelizeModelAttributes = {},
): Promise<Pick<SecurityAttributes, T>[]> {
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
    })) as Pick<SecurityAttributes, T>[];

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
    if (process.env.NODE_ENV === 'production') {
      tickers = await marketDataService.getUSStockTickers();
    } else {
      tickers = tickersMock as TickersResponse;
    }

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
        })) as SecurityAttributes[],
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

    if (process.env.NODE_ENV === 'production') {
      dailyPrices = await marketDataService.getAllDailyPricing();
    } else {
      dailyPrices = tickersPricesMock as unknown as IAggs;
    }

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
      const data: Omit<SecurityPricingAttributes, 'updatedAt' | 'createdAt'>[] =
        chunkedData.map((item) => ({
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
