import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';
import { logger } from '@js/utils';
import { removeAccountFromGroup } from '@services/account-groups/remove-account-from-group';

export const deleteAccountGroup = withTransaction(
  async ({ groupId, userId }: { groupId: number; userId: number }): Promise<void> => {
    try {
      const groupAccountMappings = await AccountGrouping.findAll({
        where: { groupId },
        include: [{ model: AccountGroup, as: 'group' }],
      });

      if (groupAccountMappings.length > 0) {
        const accountIds = groupAccountMappings.map((mapping) => mapping.accountId);
        await removeAccountFromGroup({ accountIds, groupId });
      }
      const deletedRows = await AccountGroup.destroy({ where: { id: groupId, userId } });
      if (deletedRows === 0) {
        throw new Error('Failed to delete group');
      }
    } catch (err) {
      logger.error(err);
    }
  },
);
