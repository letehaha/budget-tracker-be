import * as Accounts from '@models/Accounts.model';
import { withTransaction } from '@services/common';

export const getAccounts = withTransaction(
  async (payload: Parameters<typeof Accounts.getAccounts>[0]) => Accounts.getAccounts(payload),
);

export const getAccountsByExternalIds = withTransaction(
  async (payload: Parameters<typeof Accounts.getAccountsByExternalIds>[0]) =>
    Accounts.getAccountsByExternalIds(payload),
);

export const getAccountById = withTransaction(
  async (payload: Parameters<typeof Accounts.getAccountById>[0]) =>
    Accounts.getAccountById(payload),
);
