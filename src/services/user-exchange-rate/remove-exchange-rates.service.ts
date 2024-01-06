import { Transaction } from 'sequelize/types';

import * as UserExchangeRates from '@models/UserExchangeRates.model';

export async function removeUserExchangeRates(
  {
    userId,
    pairs,
  }: {
    userId: number;
    pairs: UserExchangeRates.ExchangeRatePair[];
  },
  { transaction }: { transaction?: Transaction } = {},
) {
  return UserExchangeRates.removeRates(
    {
      userId,
      pairs,
    },
    { transaction },
  );
}
