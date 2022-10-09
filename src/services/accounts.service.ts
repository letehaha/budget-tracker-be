import { TRANSACTION_TYPES } from 'shared-types';
import { Transaction } from 'sequelize/types';
import * as userExchangeRateService from '@services/user-exchange-rate';
import * as Accounts from '@models/Accounts.model';

export const getAccountById = async (
  { id, userId }: { id: number; userId: number },
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

const calculateNewBalance = (
  amount: number,
  previousAmount: number,
  currentBalance: number,
) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount)
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount)
  }

  return currentBalance
}

const defineCorrectAmountFromTxType = (amount: number, transactionType: TRANSACTION_TYPES) => {
  return transactionType === TRANSACTION_TYPES.income
    ? amount
    : amount * -1
};

interface updateAccountBalanceRequiredFields {
  accountId: number;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  currencyId: number;
}

// At least one of pair (amount + refAmount) OR (prevAmount + prefRefAmount) should be passed
// It is NOT allowed to pass 1 or 3 amount-related arguments

/** For **CREATED** transactions. When only (amount + refAmount) passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, amount, refAmount, currencyId }:
  updateAccountBalanceRequiredFields & { amount: number, refAmount: number },
  { transaction }: { transaction?: Transaction }
): Promise<void>

/** For **DELETED** transactions. When only (prevAmount + prefRefAmount) passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, prevAmount, prevRefAmount, currencyId }:
  updateAccountBalanceRequiredFields & { prevAmount: number; prevRefAmount: number },
  { transaction }: { transaction?: Transaction }
): Promise<void>

/** For **UPDATED** transactions. When both pairs passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, amount, prevAmount, refAmount, prevRefAmount, currencyId, prevTransactionType }:
  updateAccountBalanceRequiredFields & { amount: number; prevAmount: number; refAmount: number; prevRefAmount: number; prevTransactionType: TRANSACTION_TYPES },
  { transaction }: { transaction?: Transaction }
): Promise<void>

export async function updateAccountBalanceForChangedTx (
  {
    accountId,
    userId,
    transactionType,
    amount = 0,
    prevAmount = 0,
    refAmount = 0,
    prevRefAmount = 0,
    currencyId,
    prevTransactionType = transactionType,
  }: updateAccountBalanceRequiredFields & {
    amount?: number;
    prevAmount?: number;
    refAmount?: number;
    prevRefAmount?: number;
    prevTransactionType?: TRANSACTION_TYPES;
  },
  { transaction }: { transaction?: Transaction } = {},
): Promise<void> {
  const { currentBalance, refCurrentBalance, currencyId: accountCurrencyId } = await getAccountById(
    { id: accountId, userId },
    { transaction },
  );

  let newAmount = defineCorrectAmountFromTxType(amount, transactionType)
  const oldAmount = defineCorrectAmountFromTxType(prevAmount, prevTransactionType)
  const newRefAmount = defineCorrectAmountFromTxType(refAmount, transactionType)
  const oldRefAmount = defineCorrectAmountFromTxType(prevRefAmount, prevTransactionType)

  if (currencyId !== accountCurrencyId) {
    const { rate } = await userExchangeRateService.getExchangeRate({
      userId,
      baseId: currencyId,
      quoteId: accountCurrencyId,
    }, { transaction });

    newAmount = defineCorrectAmountFromTxType(amount * rate, transactionType)
  }

  await Accounts.updateAccountById({
    id: accountId,
    userId,
    currentBalance: calculateNewBalance(newAmount, oldAmount, currentBalance),
    refCurrentBalance: calculateNewBalance(newRefAmount, oldRefAmount, refCurrentBalance),
  }, { transaction });
}
