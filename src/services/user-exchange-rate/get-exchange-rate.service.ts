import * as UserExchangeRates from '@models/UserExchangeRates.model';
import * as ExchangeRates from '@models/ExchangeRates.model';
import * as Currencies from '@models/Currencies.model';

// Round to 5 precision
const formatRate = (rate) => Math.trunc(rate * 100000) / 100000;

export async function getExchangeRate({
  userId,
  baseId,
  quoteId,
}: {
  userId: number;
  baseId: number;
  quoteId: number;
}): Promise<UserExchangeRates.default | ExchangeRates.default>;

export async function getExchangeRate({
  userId,
  baseCode,
  quoteCode,
}: {
  userId: number;
  baseCode: string;
  quoteCode: string;
}): Promise<UserExchangeRates.default | ExchangeRates.default>;

export async function getExchangeRate({
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
}): Promise<UserExchangeRates.default | ExchangeRates.default> {
  let pair = { baseCode, quoteCode };

  if (!baseCode && !quoteCode) {
    const { code: base } = await Currencies.getCurrency({ id: Number(baseId) });
    const { code: quote } = await Currencies.getCurrency({ id: Number(quoteId) });

    pair = { baseCode: base, quoteCode: quote };
  }

  try {
    const [userExchangeRate] = await UserExchangeRates.getRates({
      userId,
      pair,
    });

    if (userExchangeRate) {
      // Add `custom` so client can understand which rate is custom
      return {
        ...userExchangeRate,
        rate: formatRate(userExchangeRate.rate),
        custom: true,
      };
    }

    const [exchangeRate] = await ExchangeRates.getRatesForCurrenciesPairs([pair]);

    return {
      ...exchangeRate,
      rate: formatRate(exchangeRate.rate),
    } as ExchangeRates.default;
  } catch (err) {
    throw new err();
  }
}
