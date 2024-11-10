import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { withTransaction } from '../common';
import { logger } from '@js/utils';

export const deleteAccountGroup = withTransaction(
  async ({ groupId, userId }: { groupId: number; userId: number }): Promise<void> => {
    try {
      await AccountGroup.destroy({ where: { id: groupId, userId } });
    } catch (err) {
      logger.error(err);
    }
  },
);
