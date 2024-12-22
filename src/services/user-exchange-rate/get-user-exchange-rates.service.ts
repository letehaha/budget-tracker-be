import * as UsersCurrencies from '@models/UsersCurrencies.model';

import { getExchangeRate } from './get-exchange-rate.service';
import { withTransaction } from '../common';

/**
 * By default we just return system exchange rates from ExchangeRates table.
 * If user wants to edit exchange rate, he can add one to UserExchangeRates, so
 * then we will return and use his custom rate. If user wants to use system rate
 * back, we need to remove his custom record from UserExchangeRates table
 */

export const getUserExchangeRates = withTransaction(async ({ userId }: { userId: number }) => {
  const userBaseCurrency = await UsersCurrencies.getBaseCurrency({ userId });
  const userCurrencies = await UsersCurrencies.getCurrencies({ userId });

  const exchangeRates = await Promise.all(
    userCurrencies.map((item) =>
      getExchangeRate({
        userId,
        baseId: item.currencyId,
        quoteId: userBaseCurrency.currencyId,
        date: new Date(),
      }),
    ),
  );

  return exchangeRates;
});
