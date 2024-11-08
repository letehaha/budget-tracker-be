import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { withTransaction } from '../common';
import { NotFoundError } from '@js/errors';

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
