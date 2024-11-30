import * as UserExchangeRates from '@models/UserExchangeRates.model';
import * as ExchangeRates from '@models/ExchangeRates.model';
import * as Currencies from '@models/Currencies.model';
import UsersCurrencies from '@models/UsersCurrencies.model';
import {
  fetchExchangeRatesForDate,
  API_LAYER_BASE_CURRENCY_CODE,
} from '@services/exchange-rates/fetch-exchange-rates-for-date';
import { Op } from 'sequelize';
import { endOfDay, startOfDay } from 'date-fns';
import { NotFoundError } from '@js/errors';

// Round to 5 precision
const formatRate = (rate: number) => Math.trunc(rate * 100000) / 100000;

export async function getExchangeRate({
  userId,
  date,
  ...params
}: ExchangeRateParams): Promise<ExchangeRateReturnType> {
  let pair: { baseCode: string; quoteCode: string };

  if ('baseId' in params && 'quoteId' in params) {
    const { code: baseCode } = await Currencies.getCurrency({ id: params.baseId });
    const { code: quoteCode } = await Currencies.getCurrency({ id: params.quoteId });
    pair = { baseCode, quoteCode };
  } else {
    pair = { baseCode: params.baseCode, quoteCode: params.quoteCode };
  }

  if (pair.baseCode === pair.quoteCode) {
    return {
      baseCode: pair.baseCode,
      quoteCode: pair.quoteCode,
      rate: 1,
      date,
    };
  }

  const userCurrency = await UsersCurrencies.findOne({
    where: { userId },
    include: [
      {
        model: Currencies.default,
        where: { code: pair.baseCode },
        attributes: [],
      },
    ],
  });

  if (!userCurrency) {
    throw new NotFoundError({ message: 'Asked currency is not connected' });
  }

  if (userCurrency && userCurrency.liveRateUpdate === false) {
    const [userExchangeRate] = await UserExchangeRates.getRates({
      userId,
      pair: pair,
    });

    if (userExchangeRate) {
      return {
        ...userExchangeRate,
        rate: formatRate(userExchangeRate.rate),
        custom: true,
      };
    }
  }

  const liveRateWhereCondition = {
    date: { [Op.between]: [startOfDay(date), endOfDay(date)] },
  };

  let baseRate, quoteRate;

  if (pair.baseCode !== API_LAYER_BASE_CURRENCY_CODE) {
    baseRate = await ExchangeRates.default.findOne({
      where: { ...liveRateWhereCondition, baseCode: API_LAYER_BASE_CURRENCY_CODE, quoteCode: pair.baseCode },
      raw: true,
    });
  }

  if (pair.quoteCode !== API_LAYER_BASE_CURRENCY_CODE) {
    quoteRate = await ExchangeRates.default.findOne({
      where: { ...liveRateWhereCondition, baseCode: API_LAYER_BASE_CURRENCY_CODE, quoteCode: pair.quoteCode },
      raw: true,
    });
  }

  if (!baseRate || !quoteRate) {
    await fetchExchangeRatesForDate(date);

    if (!baseRate && pair.baseCode !== API_LAYER_BASE_CURRENCY_CODE) {
      baseRate = await ExchangeRates.default.findOne({
        where: { ...liveRateWhereCondition, baseCode: API_LAYER_BASE_CURRENCY_CODE, quoteCode: pair.baseCode },
        raw: true,
      });
    }
    if (!quoteRate && pair.quoteCode !== API_LAYER_BASE_CURRENCY_CODE) {
      quoteRate = await ExchangeRates.default.findOne({
        where: { ...liveRateWhereCondition, baseCode: API_LAYER_BASE_CURRENCY_CODE, quoteCode: pair.quoteCode },
        raw: true,
      });
    }
  }

  if (pair.baseCode === API_LAYER_BASE_CURRENCY_CODE) {
    return quoteRate;
  } else if (pair.quoteCode === API_LAYER_BASE_CURRENCY_CODE) {
    return { ...baseRate, rate: 1 / baseRate!.rate };
  } else {
    const crossRate = quoteRate!.rate / baseRate!.rate;
    return {
      baseCode: pair.baseCode,
      quoteCode: pair.quoteCode,
      rate: formatRate(crossRate),
      date: quoteRate!.date,
    };
  }
}

type ExchangeRateParams = {
  userId: number;
  date: Date;
} & ({ baseId: number; quoteId: number } | { baseCode: string; quoteCode: string });

type ExchangeRateReturnType = {
  baseCode: string;
  quoteCode: string;
  date: Date;
  rate: number;
  // Add `custom` so client can understand that rate is custom
  custom?: boolean;
};
