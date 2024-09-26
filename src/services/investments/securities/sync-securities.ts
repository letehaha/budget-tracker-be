import { SECURITY_PROVIDER, ASSET_CLASS, SecurityModel, SecurityPricingModel } from 'shared-types';
import { differenceInMinutes, differenceInSeconds, format, subDays } from 'date-fns';
import type { IAggs } from '@polygon.io/client-js';
import { logger } from '@js/utils';
import Securities from '@models/investments/Security.model';
import SecurityPricing from '@models/investments/SecurityPricing.model';
import chunk from 'lodash/chunk';
import { marketDataService, type TickersResponse } from '../market-data.service';

import tickersMock from '../mocks/tickers-mock.json';
import tickersPricesMock from '../mocks/tickers-prices-mock.json';
import { withTransaction } from '@services/common';
import { redisKeyFormatter } from '@common/lib/redis';
import { redisClient } from '@root/redis';
import { loadSecuritiesList } from './get-securities-list';
import { LockedError } from '@js/errors';

const IS_TEST_ENV = process.env.NODE_ENV === 'test';

const SECURITIES_REDIS_SYNC_LOCK_KEY = redisKeyFormatter('sync-securities-sync-locked');
const SECURITIES_REDIS_LAST_SYNC_KEY = redisKeyFormatter('sync-securities-data-last-sync');
const SECURITIES_REDIS_KEY_VALUE = 'true';
export const SECURITIES_LOCK_TIME_SECONDS = 12 * 60 * 60; // 12 hours

function getNextSyncTime(lastSyncDate: string): Date {
  const lastSync = new Date(lastSyncDate);
  const nextSyncTime = new Date(lastSync.getTime() + SECURITIES_LOCK_TIME_SECONDS * 1000);
  return nextSyncTime;
}

const securitiesLocker = {
  async lock() {
    await redisClient.set(SECURITIES_REDIS_SYNC_LOCK_KEY, SECURITIES_REDIS_KEY_VALUE);
    await redisClient.set(SECURITIES_REDIS_LAST_SYNC_KEY, new Date().toISOString());
    await redisClient.expire(SECURITIES_REDIS_LAST_SYNC_KEY, SECURITIES_LOCK_TIME_SECONDS);
  },
  async release() {
    await redisClient.del(SECURITIES_REDIS_SYNC_LOCK_KEY);
  },
  async isSyncing() {
    const result = await redisClient.get(SECURITIES_REDIS_SYNC_LOCK_KEY);
    return result === SECURITIES_REDIS_KEY_VALUE;
  },
  async getLastSyncTime() {
    return await redisClient.get(SECURITIES_REDIS_LAST_SYNC_KEY);
  },
  async isAllowedToSyncAgain() {
    const lastSyncTime = await this.getLastSyncTime();
    const isCurrentlySyncing = await this.isSyncing();
    const currentTime = new Date().toISOString();

    if (isCurrentlySyncing) {
      logger.warn('Sync securities data is already in progress, skipping');
      return false;
    }
    if (
      lastSyncTime &&
      differenceInSeconds(new Date(currentTime), new Date(lastSyncTime)) <
        SECURITIES_LOCK_TIME_SECONDS
    ) {
      logger.warn('Sync securities data is locked, skipping');
      return false;
    }

    // release lock just in case to avoid false locking
    await this.release();
    await redisClient.del(SECURITIES_REDIS_LAST_SYNC_KEY);

    return true;
  },
};

export const syncSecuritiesData = withTransaction(async () => {
  try {
    const isAllowedToSync = await securitiesLocker.isAllowedToSyncAgain();
    if (!isAllowedToSync) {
      throw new LockedError({ message: 'Sync securities data is already in progress.' });
    }

    await securitiesLocker.lock();

    await syncSecuritiesList();
    await syncSecuritiesPricing();

    await securitiesLocker.release();

    logger.info('Finished syncing all securities data.');
  } catch (err) {
    if (!(err instanceof LockedError)) {
      // release if any error except LockedError occurs to avoid deadlocks
      await securitiesLocker.release();
    }
    logger.error('Error syncing securities data.', err);
    throw err;
  }
});

export const checkSecuritiesSyncingStatus = async () => {
  const isCurrentlySyncing = await securitiesLocker.isSyncing();
  const lastSyncTime = await securitiesLocker.getLastSyncTime();
  const nextSyncTime = lastSyncTime ? getNextSyncTime(lastSyncTime) : null;

  return {
    isCurrentlySyncing,
    lastSyncTime,
    nextSyncTime,
  };
};

const syncSecuritiesList = withTransaction(async () => {
  if (!process.env.POLYGON_API_KEY && !IS_TEST_ENV) {
    logger.warn('No Polygon API key found, skipping sync');
    return;
  }

  const startProfiling = new Date();
  logger.info(`Started syncing stock tickers. ${startProfiling.toISOString()}`);

  let tickers: TickersResponse = [];
  if (IS_TEST_ENV) {
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
            new Set(chunkedData.map((item) => `${item.ticker}-${item.exchangeMic}`)).size
          }
          uniqueValues: ${[
            ...new Set(chunkedData.map((item) => `${item.ticker}-${item.exchangeMic}`)),
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

  return tickers;
});

const syncSecuritiesPricing = withTransaction(async () => {
  if (!process.env.POLYGON_API_KEY && !IS_TEST_ENV) {
    logger.warn('No polygon API key found, skipping sync');
    return;
  }

  let dailyPrices: IAggs;

  const startProfiling = new Date();
  logger.info(`Started syncing stock tickers prices. ${startProfiling.toISOString()}`);

  if (IS_TEST_ENV) {
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
      Records loaded: ${dailyPrices.results!.length}.
    `);

  const securities = await loadSecuritiesList({
    attributes: ['assetClass', 'id', 'symbol', 'currencyCode'],
  });

  const prices = await marketDataService.getEndOfDayPricing(securities, dailyPrices);

  const result: Omit<SecurityPricingModel, 'updatedAt' | 'createdAt' | 'security'>[] = [];

  for (const chunkedData of chunk(prices, 500)) {
    const data: typeof result = chunkedData.map((item) => ({
      securityId: item.security.id,
      date: new Date(item.pricing.updatedAt),
      priceClose: String(item.pricing.price),
      priceAsOf: new Date(item.pricing.updatedAt),
      source: marketDataService.source,
    }));

    result.push(...data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await SecurityPricing.bulkCreate(data as any, {
      updateOnDuplicate: ['priceClose', 'priceAsOf', 'updatedAt', 'source'],
    });
  }

  // TODO: update balances

  return result;
});
