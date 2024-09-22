import { makeRequest } from './common';
import { editUserExchangeRates } from '@root/services/user-exchange-rate';

type ExchangeRatePair = {
  baseCode: string;
  quoteCode: string;
  rate: number;
};

export async function editCurrencyExchangeRate<R extends boolean | undefined = undefined>({
  pairs,
  raw,
}: {
  pairs: ExchangeRatePair[];
  raw?: R;
}) {
  const result = await makeRequest<Awaited<ReturnType<typeof editUserExchangeRates>>, R>({
    method: 'put',
    url: '/user/currency/rates',
    payload: { pairs },
    raw,
  });

  return result;
}
