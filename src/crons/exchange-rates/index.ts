import { CronJob } from 'cron';
import { syncExchangeRates } from '@services/exchange-rates/sync-exchange-rates';
import { logger } from '@js/utils';

export const loadCurrencyRatesJob = new CronJob(
  // Every day at 1am
  '0 1 * * *',
  async function () {
    try {
      await syncExchangeRates();
    } catch (error) {
      logger.error('Load currency exchange rates cron job is failed.', error);
    }
  },
  null, // onComplete
  false,
  'UTC', // timeZone
);
