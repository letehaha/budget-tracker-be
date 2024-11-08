import AccountGrouping from '@models/accounts-groups/AccountGrouping.model';
import { withTransaction } from '../common';
import AccountGroup from '@models/accounts-groups/AccountGroups.model';
import { NotFoundError } from '@js/errors';
import Accounts from '@models/Accounts.model';

export const removeAccountFromGroup = withTransaction(
  async ({ accountId, groupId }: { accountId: number; groupId: number }): Promise<void> => {
    if (!(await AccountGroup.findByPk(groupId))) {
      throw new NotFoundError({ message: 'Group with provided id does not exist' });
    }
    if (!(await Accounts.findByPk(accountId))) {
      throw new NotFoundError({ message: 'Account with provided id does not exist' });
    }

    await AccountGrouping.destroy({ where: { accountId, groupId } });
  },
);
