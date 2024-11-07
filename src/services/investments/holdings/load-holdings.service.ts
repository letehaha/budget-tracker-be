import Accounts from '@models/Accounts.model';
import Users from '@models/Users.model';
import Holdings from '@models/investments/Holdings.model';
import { withTransaction } from '@root/services/common';

export const loadHoldingsList = withTransaction(async ({ userId }: { userId: number }) => {
  const holdings = await Holdings.findAll({
    include: [
      {
        model: Accounts,
        required: true,
        where: { userId }, // Direct filtering by userId on the Account
        include: [
          {
            model: Users,
            required: true,
          },
        ],
      },
    ],
  });

  return holdings;
});
