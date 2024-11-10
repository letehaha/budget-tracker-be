import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { withTransaction } from '../common';
import { Op } from 'sequelize';
import Accounts from '@models/Accounts.model';

export const getAccountGroups = withTransaction(
  async ({
    userId,
    accountIds = [],
  }: {
    userId: number;
    accountIds?: number[];
  }): Promise<AccountGroup[]> => {
    return AccountGroup.findAll({
      where: { userId },
      include: [
        { model: AccountGroup, as: 'childGroups' },
        {
          model: Accounts,
          where: accountIds.length > 0 ? { id: { [Op.in]: accountIds } } : undefined,
          through: { attributes: [] },
          required: accountIds.length > 0,
        },
      ],
    });
  },
);
