import { makeRequest } from './common';
import ExchangeRates from '@models/ExchangeRates.model';
import Currencies from '@models/Currencies.model';
import UsersCurrencies from '@models/UsersCurrencies.model';
import { UpdateExchangeRatePair } from '@models/UserExchangeRates.model';
import { addUserCurrencies as apiAddUserCurrencies } from '@root/services/currencies/add-user-currency';

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

export function addUserCurrencies<R extends boolean | undefined = undefined>({
  currencyIds = [],
  currencyCodes = [],
  raw,
}: {
  currencyIds?: number[];
  currencyCodes?: string[];
  raw?: R;
} = {}) {
  return makeRequest<Awaited<ReturnType<typeof apiAddUserCurrencies>>, R>({
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

export function getAllCurrencies(): Promise<Currencies[]> {
  return makeRequest({
    method: 'get',
    url: '/models/currencies',
    raw: true,
  });
}

export async function updateUserCurrencies<R extends boolean | undefined = undefined>({
  currencies,
  raw,
}: {
  currencies: { currencyId: number; exchangeRate?: number; liveRateUpdate?: boolean }[];
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof apiAddUserCurrencies>>, R>({
    method: 'post',
    url: '/user/currencies',
    payload: { currencies },
    raw,
  });
}
