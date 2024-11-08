import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';

export * from './create-account-group';
export * from './edit-account-group';
export * from './delete-account-group';

export const getAccountGroups = withTransaction(
  async ({ userId }: { userId: number }): Promise<AccountGroup[]> => {
    return AccountGroup.findAll({
      where: { userId },
      include: [{ model: AccountGroup, as: 'childGroups' }],
    });
  },
);

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

export const removeAccountFromGroup = withTransaction(
  async ({ accountId, groupId }: { accountId: number; groupId: number }): Promise<number> => {
    return AccountGrouping.destroy({ where: { accountId, groupId } });
  },
);

export const moveAccountGroup = withTransaction(
  async ({
    groupId,
    newParentGroupId,
    userId,
  }: {
    groupId: number;
    newParentGroupId: number | null;
    userId: number;
  }): Promise<[number, AccountGroup[]]> => {
    return AccountGroup.update(
      { parentGroupId: newParentGroupId },
      { where: { id: groupId, userId }, returning: true },
    );
  },
);

export const getAccountsInGroup = withTransaction(
  async ({ groupId }: { groupId: number }): Promise<AccountGrouping[]> => {
    return AccountGrouping.findAll({
      where: { groupId },
      include: [{ model: AccountGroup, as: 'group' }],
    });
  },
);
