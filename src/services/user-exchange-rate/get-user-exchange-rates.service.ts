import { Transaction } from 'sequelize/types';
import { connection } from '@models/index';

import * as UsersCurrencies from '@models/UsersCurrencies.model';

import { getExchangeRate } from './get-exchange-rate.service';

export async function getUserExchangeRates(
  { userId }: { userId: number },
  { transaction }: { transaction?: Transaction } = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;

  transaction = transaction ?? await connection.sequelize.transaction();

  try {
    const userBaseCurrency = await UsersCurrencies.getBaseCurrency(
      { userId },
      { transaction },
    );
    const userCurrencies = await UsersCurrencies.getCurrencies(
      { userId },
      { transaction },
    );

    const exchangeRates = await Promise.all(
      userCurrencies.map(item => getExchangeRate(
        {
          userId,
          baseId: item.currencyId,
          quoteId: userBaseCurrency.currencyId,
        },
        { transaction },
      ))
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return exchangeRates;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw new err;
  }
}
