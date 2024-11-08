import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';

export const addAccountToGroup = withTransaction(
  async ({
    accountId,
    groupId,
  }: {
    accountId: number;
    groupId: number;
  }): Promise<AccountGrouping> => {
    return AccountGrouping.create({ accountId, groupId });
  },
);
