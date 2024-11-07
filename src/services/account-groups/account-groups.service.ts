import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';
import { NotFoundError } from '@js/errors';

export const createAccountGroup = withTransaction(
  async ({
    userId,
    name,
    parentGroupId,
  }: {
    userId: number;
    name: string;
    parentGroupId?: number | null;
  }): Promise<AccountGroup> => {
    if (parentGroupId) {
      const existingParent = await AccountGroup.findByPk(parentGroupId);

      if (!existingParent) {
        throw new NotFoundError({ message: 'Parent group does not exists.' });
      }
    }

    return AccountGroup.create({ userId, name, parentGroupId });
  },
);

export const getAccountGroups = withTransaction(
  async ({ userId }: { userId: number }): Promise<AccountGroup[]> => {
    return AccountGroup.findAll({
      where: { userId },
      include: [{ model: AccountGroup, as: 'childGroups' }],
    });
  },
);

export const updateAccountGroup = withTransaction(
  async ({
    groupId,
    userId,
    ...updates
  }: {
    groupId: number;
    userId: number;
  } & Partial<Pick<AccountGroup, 'name' | 'parentGroupId'>>): Promise<AccountGroup[]> => {
    const existingGroup = await AccountGroup.findByPk(groupId);

    if (!existingGroup) {
      throw new NotFoundError({ message: 'Group not found' });
    }

    if (updates.parentGroupId) {
      const existingParent = await AccountGroup.findByPk(updates.parentGroupId);

      if (!existingParent) {
        throw new NotFoundError({ message: 'Parent with such id does not exist.' });
      }
    }

    const [, updatedGroup] = await AccountGroup.update(updates, {
      where: { id: groupId, userId },
      returning: true,
    });

    return updatedGroup;
  },
);

export const deleteAccountGroup = withTransaction(
  async ({ groupId, userId }: { groupId: number; userId: number }): Promise<number> => {
    return AccountGroup.destroy({ where: { id: groupId, userId } });
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
