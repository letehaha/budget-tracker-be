import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import Accounts from '@models/Accounts.model';
import { removeUndefinedKeys } from '@js/helpers';
import { withTransaction } from '@root/services/common';

export const getInvestmentTransactions = withTransaction(
  async ({
    accountId,
    securityId,
    userId,
  }: {
    accountId?: number;
    securityId?: number;
    userId: number;
  }) => {
    const result = await InvestmentTransaction.findAll({
      where: removeUndefinedKeys({ accountId, securityId }),
      include: [
        {
          // Check that accountId is associated with that user
          model: Accounts,
          where: { userId },
          // Don't include account info into response
          attributes: [],
        },
      ],
    });

    return result;
  },
);
