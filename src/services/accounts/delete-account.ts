import * as Accounts from '@models/Accounts.model';
import { withTransaction } from '@services/common';

export const deleteAccountById = withTransaction(
  async (payload: Parameters<typeof Accounts.deleteAccountById>[0]) => {
    return Accounts.deleteAccountById(payload);
  },
);
