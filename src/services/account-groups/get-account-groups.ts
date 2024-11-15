import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { withTransaction } from '../common';
import { Op, type WhereOptions } from 'sequelize';
import Accounts from '@models/Accounts.model';

export const getAccountGroups = withTransaction(
  async ({
    userId,
    accountIds = [],
    hidden = false,
  }: {
    userId: number;
    accountIds?: number[];
    hidden?: boolean;
  }): Promise<AccountGroup[]> => {
    const accountWhere: WhereOptions<Accounts> = {};

    if (accountIds.length > 0) {
      accountWhere.id = { [Op.in]: accountIds };
    }

    if (!hidden) {
      accountWhere.isEnabled = true;
    }

    return AccountGroup.findAll({
      where: { userId },
      include: [
        { model: AccountGroup, as: 'childGroups' },
        {
          model: Accounts,
          where: accountWhere,
          through: { attributes: [] },
          required: accountIds.length > 0,
        },
      ],
    });
  },
);
