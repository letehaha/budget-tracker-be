import { Transaction } from 'sequelize/types';
import * as Accounts from '@models/Accounts.model';

export const getAccountById = async (
  { id, userId },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const accounts = await Accounts.getAccountById({ userId, id }, { transaction });

  return accounts;
};

export const createAccount = async (
  {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
    internal,
  }: {
    accountTypeId: number;
    currencyId: number;
    name: string;
    currentBalance: number;
    creditLimit: number;
    userId: number;
    internal?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {}
) => {
  const account = await Accounts.createAccount({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
    internal,
  }, { transaction });

  return account;
}

export const updateAccount = async (
  {
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
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const data = await Accounts.updateAccountById({
    id,
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
  }, { transaction });

  return data;
};
