import * as Accounts from '../models/Accounts.model';

export const getAccountById = async ({ id, userId }) => {
  const accounts = await Accounts.getAccountById({ userId, id });

  return accounts;
};

export const updateAccount = async ({
  id,
  userId,
  accountTypeId,
  currencyId,
  name,
  currentBalance,
  creditLimit,
}: {
  id: number;
  userId: number;
  accountTypeId?: number;
  currencyId?: number;
  name?: string;
  currentBalance?: number;
  creditLimit?: number;
}) => {
  const data = await Accounts.updateAccountById({
    id,
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
  });

  return data;
};
