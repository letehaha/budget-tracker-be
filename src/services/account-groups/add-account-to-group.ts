import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';
import Accounts from '@models/Accounts.model';
import { ConflictError, NotAllowedError, NotFoundError } from '@js/errors';
import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { logger } from '@js/utils';

export const addAccountToGroup = withTransaction(
  async ({
    accountId,
    groupId,
  }: {
    accountId: number;
    groupId: number;
  }): Promise<AccountGrouping> => {
    const existingAccount = await Accounts.findByPk(accountId);
    if (!existingAccount) {
      throw new NotFoundError({ message: 'Account with such id is not found.' });
    }

    const existingGroup = await AccountGroup.findByPk(groupId);
    if (!existingGroup) {
      throw new NotFoundError({ message: 'Account group with such id is not found.' });
    }

    const existingGrouping = await AccountGrouping.findOne({
      where: { accountId, groupId },
    });
    if (existingGrouping) {
      throw new ConflictError({ message: 'Account is already in this group' });
    }

    if (existingAccount.userId !== existingGroup.userId) {
      logger.error('Tried to add account to a group with different userId in both.', {
        accountId,
        groupId,
      });
      throw new NotAllowedError({ message: 'Operation is not allowed' });
    }
    return AccountGrouping.create({ accountId, groupId });
  },
);
