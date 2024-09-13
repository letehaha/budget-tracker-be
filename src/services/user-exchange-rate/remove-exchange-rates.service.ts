import * as UserExchangeRates from '@models/UserExchangeRates.model';
import { withTransaction } from '../common';

export const removeUserExchangeRates = withTransaction(
  async ({ userId, pairs }: { userId: number; pairs: UserExchangeRates.ExchangeRatePair[] }) => {
    return UserExchangeRates.removeRates({
      userId,
      pairs,
    });
  },
);
