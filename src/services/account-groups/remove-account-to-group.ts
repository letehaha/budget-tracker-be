import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';

export const removeAccountFromGroup = withTransaction(
  async ({ accountId, groupId }: { accountId: number; groupId: number }): Promise<number> => {
    return AccountGrouping.destroy({ where: { accountId, groupId } });
  },
);
