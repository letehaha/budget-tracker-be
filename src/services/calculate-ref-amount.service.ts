import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as userExchangeRateService from '@services/user-exchange-rate';
import * as Currencies from '@models/Currencies.model';

interface BaseParams {
  amount: number;
  userId: number;
}

/**
 * Calculates the reference amount for the provided currencies and parameters.
 * Accepts either currency codes or currency IDs.
 * If the quote currency code or ID is not provided, the default user currency is used.
 * If the base currency code or ID is the same as the user's default currency or the quote currency, the original amount is returned.
 *
 * @async
 * @export
 * @param {Object} params
 * @param {number} params.amount - The amount to be converted. Amount represents `baseCode` or `baseId` currency.
 * @param {number} params.userId - The ID of the user for whom the exchange rate is to be fetched.
 * @param {string} [params.baseCode] - The base currency code (optional if `baseId` provided).
 * @param {string} [params.quoteCode] - The quote currency code (optional if `quoteId` provided or if using user's default currency).
 * @param {number} [params.baseId] - The base currency ID (optional if `baseCode` provided).
 * @param {number} [params.quoteId] - The quote currency ID (optional if `quoteCode` provided or if using user's default currency).
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional attributes, such as a transaction object.
 * @returns {Promise<number>} The reference amount after conversion, or the original amount if the base currency is the user's default or the same as the quote currency.
 * @throws {Error} Throws an error if the exchange rate cannot be fetched or the transaction fails.
 * @example
 * const refAmount = await calculateRefAmount({ amount: 100, userId: 42, baseCode: 'USD', quoteCode: 'EUR' });
 * const refAmountByIds = await calculateRefAmount({ amount: 100, userId: 42, baseId: 1, quoteId: 2 });
 * const refAmountForDefaultUserCurrency = await calculateRefAmount({ amount: 100, userId: 42, baseCode: 'USD' });
 */
export async function calculateRefAmount(
  {
    amount,
    userId,
    baseCode,
    quoteCode,
  }: BaseParams & { baseCode: string; quoteCode?: string },
  attributes: GenericSequelizeModelAttributes,
);
export async function calculateRefAmount(
  {
    amount,
    userId,
    baseId,
    quoteId,
  }: BaseParams & { baseId: number; quoteId?: number },
  attributes: GenericSequelizeModelAttributes,
);
export async function calculateRefAmount(
  {
    amount,
    userId,
    baseCode,
    quoteCode,
    baseId,
    quoteId,
  }: BaseParams & {
    baseId?: number;
    quoteId?: number;
    baseCode?: string;
    quoteCode?: string;
  },
  attributes: GenericSequelizeModelAttributes,
): Promise<number> {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    let defaultUserCurrency: Currencies.default;

    if (!baseCode && baseId) {
      baseCode = (await Currencies.getCurrency({ id: baseId }, { transaction }))
        ?.code;
    }

    if (!quoteCode && quoteId) {
      quoteCode = (
        await Currencies.getCurrency({ id: quoteId }, { transaction })
      )?.code;
    }

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

    const { rate } = await userExchangeRateService.getExchangeRate(
      {
        userId,
        baseCode,
        quoteCode: quoteCode || defaultUserCurrency.code,
      },
      { transaction },
    );

    const isNegative = amount < 0;
    const refAmount = amount === 0 ? 0 : Math.floor(Math.abs(amount) * rate);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return isNegative ? refAmount * -1 : refAmount;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw e;
  }
}
