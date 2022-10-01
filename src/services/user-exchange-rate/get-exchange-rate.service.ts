import { Transaction } from 'sequelize/types';

import * as UserExchangeRates from '@models/UserExchangeRates.model';
import * as ExchangeRates from '@models/ExchangeRates.model';

export const getExchangeRate = async (
  {
    userId,
    baseCode,
    quoteCode,
  }: {
    userId: number;
    baseCode: string;
    quoteCode: string;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  try {
    const [userExchangeRate] = await UserExchangeRates.getRates({
      userId,
      pair: { baseCode, quoteCode },
    }, { transaction });

    if (userExchangeRate) return userExchangeRate

    const [exchangeRate] = await ExchangeRates.getRatesForCurrenciesPairs(
      [{ baseCode, quoteCode }],
      { transaction },
    );

    return exchangeRate;
  } catch (err) {
    throw new err;
  }
};
