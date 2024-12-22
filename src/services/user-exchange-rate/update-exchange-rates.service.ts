import * as UserExchangeRates from '@models/UserExchangeRates.model';
import { withTransaction } from '../common';

export const editUserExchangeRates = withTransaction(
  async ({ userId, pairs }: { userId: number; pairs: UserExchangeRates.UpdateExchangeRatePair[] }) => {
    return UserExchangeRates.updateRates({
      userId,
      pairs,
    });
  },
);
