import { Transaction } from 'sequelize/types';

import * as UserExchangeRates from '@models/UserExchangeRates.model';

export async function editUserExchangeRates(
  {
    userId,
    pairs,
  }: {
    userId: number;
    pairs: UserExchangeRates.UpdateExchangeRatePair[]
  },
  { transaction }: { transaction?: Transaction } = {},
) {
  return UserExchangeRates.updateRates({
    userId,
    pairs,
  }, { transaction });
}
