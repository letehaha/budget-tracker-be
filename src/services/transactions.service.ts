import { TRANSACTION_TYPES } from 'shared-types'

import * as Transactions from '../models/Transactions.model';
import * as accountsService from './accounts.service';
import * as transactionTypesService from './transaction-types.service'

/**
 * Creates transaction and updates account balance.
 */
export const createTransaction = async ({
  amount,
  note,
  time,
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
  transactionEntityId,
  userId,
}) => {
  const data = await Transactions.createTransaction({
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
    transactionEntityId,
  });

  const transactionType = await transactionTypesService.getTransactionTypeById(transactionTypeId)

  const { currentBalance } = await accountsService.getAccountById({
    id: accountId,
    userId,
  })

  const isIncome = transactionType.type === TRANSACTION_TYPES.income
  // Increase account's currentBalance on passed "amount" only if it is an "income".
  // if type is "expense" or "transfer", balance decreases in both ways.
  const newBalance = isIncome ? currentBalance + amount : currentBalance - amount

  await accountsService.updateAccount({
    id: accountId,
    userId,
    currentBalance: newBalance,
  })

  return data
};

/**
 * Updates transaction and updates account balance.
 */
export const updateTransactionById = async ({
  id,
  amount,
  note,
  time,
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
  userId,
}) => {
  const { amount: oldAmount } = await Transactions.getTransactionById({ id, userId })

  const data = await Transactions.updateTransactionById({
    id,
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  });

  const { currentBalance } = await accountsService.getAccountById({
    id: accountId,
    userId,
  })

  // if amount SAME, do NOTHING
  // if amount MORE, currentBalance + (newAmount - oldAmount)
  // if amount LESS, currentBalance - (oldAmount - newAmount)

  let newBalance = currentBalance

  if (amount > oldAmount) {
    newBalance = currentBalance + (amount - oldAmount)
  } else if (amount < oldAmount) {
    newBalance = currentBalance - (oldAmount - amount)
  }

  await accountsService.updateAccount({
    id: accountId,
    userId,
    currentBalance: newBalance,
  })

  return data
};
