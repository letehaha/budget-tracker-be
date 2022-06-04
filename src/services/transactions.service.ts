import { Transaction } from 'sequelize/types';
import { TRANSACTION_TYPES, ERROR_CODES } from 'shared-types'

import { connection } from '@models/index';
import { UnexpectedError } from '@js/errors'
import * as Transactions from '@models/Transactions.model';
import * as accountsService from '@services/accounts.service';

const transformAmountDependingOnTxType = async (
  { amount, transactionType }: { transactionType: TRANSACTION_TYPES; amount: number },
) => {
  const isIncome = transactionType === TRANSACTION_TYPES.income
  if (!isIncome) amount *= -1
  return amount
}

/**
 * Updates the balance of the account associated with the transaction
 */
const updateAccountBalance = async (
  {
    transactionType,
    accountId,
    userId,
    amount,
    // keep it 0 be default for the tx creation flow
    previousAmount = 0,
    previousTransactionType,
  }: {
    transactionType: TRANSACTION_TYPES;
    accountId: number;
    userId: number;
    amount: number;
    previousAmount?: number;
    previousTransactionType?: TRANSACTION_TYPES;
  },
  { transaction }: { transaction: Transaction },
) => {
  try {
    const { currentBalance } = await accountsService.getAccountById(
      { id: accountId, userId },
      { transaction },
    );

    if (previousTransactionType) {
      // Make the previous amount value positive or negative depending on the tx type
      previousAmount = await transformAmountDependingOnTxType({
          amount: previousAmount,
          transactionType: previousTransactionType,
        })
    }

    // Make the current amount value positive or negative depending on the tx type
    amount = await transformAmountDependingOnTxType({
      amount,
      transactionType,
    })

    let newBalance = currentBalance

    if (amount > previousAmount) {
      newBalance = currentBalance + (amount - previousAmount)
    } else if (amount < previousAmount) {
      newBalance = currentBalance - (previousAmount - amount)
    } else if (amount === previousAmount) {
      newBalance = currentBalance + amount
    }

    await accountsService.updateAccount(
      {
        id: accountId,
        userId,
        currentBalance: newBalance,
      },
      { transaction },
    )
  } catch (e) {
    console.error(e);
    throw new UnexpectedError(
      ERROR_CODES.txServiceUpdateBalance,
      'Cannot update balance.'
    )
  }
};

/**
 * Creates transaction and updates account balance.
 */
export const createTransaction = async ({
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  accountType,
  userId,
}) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const data = await Transactions.createTransaction(
      {
        amount,
        note,
        time,
        userId,
        transactionType,
        paymentType,
        accountId,
        categoryId,
        accountType,
      },
      { transaction }
    );

    await updateAccountBalance({
      transactionType,
      accountId,
      userId,
      amount,
    }, { transaction })

    await transaction.commit();

    return data
  } catch (e) {
    await transaction.rollback();
    console.error(e);
    throw e;
  }
};

/**
 * Updates transaction and updates account balance.
 */
export const updateTransaction = async ({
  id,
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  userId,
}) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      transactionType: previousTransactionType,
    } = await Transactions.getTransactionById(
      { id, userId },
      { transaction },
    )

    const data = await Transactions.updateTransactionById(
      {
        id,
        amount,
        note,
        time,
        userId,
        transactionType,
        paymentType,
        accountId,
        categoryId,
      },
      { transaction },
    );

    await updateAccountBalance(
      {
        transactionType,
        accountId,
        userId,
        amount,
        previousAmount,
        previousTransactionType,
      },
      { transaction },
    )

    await transaction.commit();

    return data
  } catch (e) {
    console.error(e);
    await transaction.rollback();
    throw e;
  }
};

export const deleteTransaction = async ({
  id,
  userId,
}: {
  id: number;
  userId: number;
}) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      transactionType,
      accountId,
    } = await Transactions.getTransactionById({ id, userId }, { transaction })

    await updateAccountBalance(
      {
        userId,
        accountId,
        transactionType,
        previousTransactionType: transactionType,
        // make new amount 0, so the balance won't depend on this tx anymore
        amount: 0,
        previousAmount,
      },
      { transaction },
    )

    await Transactions.deleteTransactionById({ id, userId }, { transaction });

    await transaction.commit();
  } catch (e) {
    console.error(e);
    await transaction.rollback();
    throw e
  }
};
