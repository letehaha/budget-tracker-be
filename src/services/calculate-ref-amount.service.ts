import { connection } from '@models/index';
import { logger} from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as userExchangeRateService from '@services/user-exchange-rate';
import Currencies from '@models/Currencies.model';

/**
 * Calculates the reference amount for passed provided currencies and parameters.
 * If the quote currency code is not provided, the default user currency is used.
 * If the base currency code is the same as the user's default currency, the original amount is returned.
 *
 * @async
 * @export
 * @param {Object} params
 * @param {number} params.amount - The amount to be converted. Amount is represents `baseCode` currency
 * @param {number} params.userId - The ID of the user for whom the exchange rate is to be fetched.
 * @param {string} params.baseCode - The base currency code.
 * @param {string} [params.quoteCode] - The quote currency code (optional). If not provided, the user's default currency will be used.
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional attributes, such as a transaction object.
 * @returns {Promise<number>} The reference amount after conversion.
 * @throws {Error} Throws an error if the exchange rate cannot be fetched or the transaction fails.
 * @example
 * const refAmount = await calculateRefAmount({ amount: 100, userId: 42, baseCode: 'USD', quoteCode: 'EUR' });
 * const refAmountForDefaultUserCurrency = await calculateRefAmount({ amount: 100, userId: 42, baseCode: 'USD' });
 */
export const calculateRefAmount = async (
  { amount, userId, baseCode, quoteCode }:
  { amount: number; userId: number; baseCode: string; quoteCode?: string },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<number> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    let defaultUserCurrency: Currencies

    if (!quoteCode) {
      const { currency } = await UsersCurrencies.getCurrency(
        { userId, isDefaultCurrency: true },
        { transaction },
      );
      defaultUserCurrency = currency;
    }

    // If baseCade same as default currency code no need to calculate anything
    if (defaultUserCurrency?.code === baseCode || quoteCode === baseCode) {
      if (!isTxPassedFromAbove) {
        await transaction.commit();
      }
      return amount;
    }

    const { rate } = await userExchangeRateService.getExchangeRate({
      userId,
      baseCode,
      quoteCode: quoteCode || defaultUserCurrency.code,
    }, { transaction })

    const refAmount = Math.max(Math.floor(amount * rate), 1)

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return refAmount;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw e;
  }
};
