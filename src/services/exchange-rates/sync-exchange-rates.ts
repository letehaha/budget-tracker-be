import { logger } from '@js/utils';
import { fetchExchangeRatesForDate } from './fetch-exchange-rates-for-date';

export async function syncExchangeRates(): Promise<void> {
  try {
    await fetchExchangeRatesForDate(new Date());
    logger.info('Exchange rates synced successfully');
  } catch (error) {
    logger.error('Error syncing exchange rates:', error);
    throw error;
  }
}
