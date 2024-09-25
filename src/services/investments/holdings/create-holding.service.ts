import Account from '@models/Accounts.model';
import Holdings from '@models/investments/Holdings.model';
import Security from '@models/investments/Security.model';
import { ValidationError } from '@js/errors';
import { withTransaction } from '@root/services/common';

export const createHolding = withTransaction(
  async ({
    userId,
    accountId,
    securityId,
  }: {
    userId: number;
    accountId: number;
    securityId: number;
  }) => {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new ValidationError({
        message: 'Account does not belong to the user or does not exist.',
      });
    }

    const security = await Security.findOne({
      where: { id: securityId },
    });

    if (!security) {
      throw new ValidationError({
        message: 'Security with the provided id does not exist.',
      });
    }

    const [holding] = await Holdings.findOrCreate({
      where: { accountId, securityId },
      defaults: {
        accountId,
        securityId,
        value: '0',
        refValue: '0',
        quantity: '0',
        costBasis: '0',
        refCostBasis: '0',
      },
    });

    return holding;
  },
);
