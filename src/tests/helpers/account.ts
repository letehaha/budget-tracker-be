import Currencies from '@models/Currencies.model';
import * as helpers from '@tests/helpers';

export const createAccountWithNewCurrency = async ({ currency }) => {
  const currencyA: Currencies = global.MODELS_CURRENCIES.find((item) => item.code === currency);
  await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] });

  const account = await helpers.createAccount({
    payload: {
      ...helpers.buildAccountPayload(),
      currencyId: currencyA.id,
    },
    raw: true,
  });
  const currencyRate = (await helpers.getCurrenciesRates({ codes: [currency] }))[0];

  return { account, currency: currencyA, currencyRate };
};
