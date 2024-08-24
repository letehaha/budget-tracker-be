import { makeRequest } from './common';
import ExchangeRates from '@models/ExchangeRates.model';
import Currencies from '@models/Currencies.model';
import UsersCurrencies from '@models/UsersCurrencies.model';
import { UpdateExchangeRatePair } from '@models/UserExchangeRates.model';

export async function getUserCurrencies(): Promise<(UsersCurrencies & { currency: Currencies })[]> {
  const data = await makeRequest({
    method: 'get',
    url: '/user/currencies',
    raw: true,
  });

  return data;
}

export async function getCurrenciesRates({ codes }: { codes?: string[] } = {}): Promise<
  ExchangeRates[]
> {
  const data = await makeRequest({
    method: 'get',
    url: '/user/currencies/rates',
    raw: true,
  });

  return codes ? data.filter((item) => codes.includes(item.baseCode)) : data;
}

interface AddUserCurrenciesBaseParams {
  currencyIds?: number[];
  currencyCodes?: string[];
  raw?: true | false;
}
export function addUserCurrencies({
  currencyIds,
  currencyCodes,
  raw,
}: AddUserCurrenciesBaseParams & { raw?: false }): Promise<Response>;
export function addUserCurrencies({
  currencyIds,
  currencyCodes,
  raw,
}: AddUserCurrenciesBaseParams & { raw?: true }): Promise<UsersCurrencies[]>;
export function addUserCurrencies({
  currencyIds = [],
  currencyCodes = [],
  raw = false,
}: AddUserCurrenciesBaseParams = {}) {
  return makeRequest({
    method: 'post',
    url: '/user/currencies',
    payload: {
      currencies: [
        ...currencyIds.map((id) => ({ currencyId: id })),
        ...currencyCodes.map((code) => ({
          currencyId: global.MODELS_CURRENCIES.find((item) => item.code === code).id,
        })),
      ],
    },
    raw,
  });
}

export function editUserCurrencyExchangeRate({ pairs }: { pairs: UpdateExchangeRatePair[] }) {
  return makeRequest({
    method: 'put',
    url: '/user/currency/rates',
    payload: { pairs },
    raw: true,
  });
}
