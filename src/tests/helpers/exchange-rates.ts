import { CustomResponse } from '@common/types'; // Adjust the import path as needed
import { extractResponse, makeRequest } from './common';
import { editUserExchangeRates } from '@root/services/user-exchange-rate';

type ExchangeRatePair = {
  baseCode: string;
  quoteCode: string;
  rate: number;
};

type RatesReturnType<T> = T extends true
  ? Awaited<ReturnType<typeof editUserExchangeRates>>
  : CustomResponse;

export async function editCurrencyExchangeRate<T extends boolean = false>({
  pairs,
  raw = false as T,
}: {
  pairs: ExchangeRatePair[];
  raw?: T;
}): Promise<RatesReturnType<T>> {
  const result: RatesReturnType<T> = await makeRequest({
    method: 'put',
    url: '/user/currency/rates',
    payload: { pairs },
    raw,
  });

  return raw ? extractResponse(result) : result;
}
