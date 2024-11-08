import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { withTransaction } from '../common';

export const getAccountGroups = withTransaction(
  async ({ userId }: { userId: number }): Promise<AccountGroup[]> => {
    return AccountGroup.findAll({
      where: { userId },
      include: [{ model: AccountGroup, as: 'childGroups' }],
    });
  },
);
