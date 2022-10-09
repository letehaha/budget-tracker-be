import { Transaction } from 'sequelize/types';

import * as UserExchangeRates from '@models/UserExchangeRates.model';
import * as ExchangeRates from '@models/ExchangeRates.model';
import * as Currencies from '@models/Currencies.model';

export async function getExchangeRate (
  { userId, baseId, quoteId }: { userId: number; baseId: number; quoteId: number; },
  { transaction }: { transaction?: Transaction },
): Promise<UserExchangeRates.default | ExchangeRates.default>

export async function getExchangeRate (
  { userId, baseCode, quoteCode }: { userId: number; baseCode: string; quoteCode: string; },
  { transaction }: { transaction?: Transaction },
): Promise<UserExchangeRates.default | ExchangeRates.default>

export async function getExchangeRate(
  {
    userId,
    baseId,
    quoteId,
    baseCode,
    quoteCode,
  }: {
    userId: number;
    baseId?: number;
    quoteId?: number;
    baseCode?: string;
    quoteCode?: string;
  },
  { transaction }: { transaction?: Transaction } = {},
): Promise<UserExchangeRates.default | ExchangeRates.default> {
  let pair = { baseCode, quoteCode }

  if (!baseCode && !quoteCode) {
    const { code: base } = await Currencies.getCurrency({ id: Number(baseId) }, { transaction })
    const { code: quote } = await Currencies.getCurrency({ id: Number(quoteId) }, { transaction })

    pair = { baseCode: base, quoteCode: quote }
  }

  try {
    const [userExchangeRate] = await UserExchangeRates.getRates({
      userId,
      pair,
    }, { transaction });

    if (userExchangeRate) return userExchangeRate

    const [exchangeRate] = await ExchangeRates.getRatesForCurrenciesPairs(
      [pair],
      { transaction },
    );

    return exchangeRate;
  } catch (err) {
    throw new err;
  }
}
