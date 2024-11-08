import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';

export const getAccountsInGroup = withTransaction(
  async ({ groupId }: { groupId: number }): Promise<AccountGrouping[]> => {
    return AccountGrouping.findAll({
      where: { groupId },
      include: [{ model: AccountGroup, as: 'group' }],
    });
  },
);
