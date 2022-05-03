import { Transaction } from 'sequelize/types';
import { TRANSACTION_TYPES, ERROR_CODES } from 'shared-types'

import { connection } from '@models/index';
import { UnexpectedError } from '@js/errors'
import * as Transactions from '@models/Transactions.model';
import * as accountsService from '@services/accounts.service';
import * as transactionTypesService from '@services/transaction-types.service'

const transformAmountDependingOnTxType = async (
  { amount, transactionTypeId}: { transactionTypeId: number; amount: number },
  { transaction }: { transaction: Transaction },
) => {
  const txType = await transactionTypesService.getTransactionTypeById(
    transactionTypeId, { transaction }
  );
  const isIncome = txType.type === TRANSACTION_TYPES.income
  if (!isIncome) amount *= -1
  return amount
}

/**
 * Updates the balance of the account associated with the transaction
 */
const updateAccountBalance = async (
  {
    transactionTypeId,
    accountId,
    userId,
    amount,
    // keep it 0 be default for the tx creation flow
    previousAmount = 0,
    previousTransactionTypeId,
  }: {
    transactionTypeId: number;
    accountId: number;
    userId: number;
    amount: number;
    previousAmount?: number;
    previousTransactionTypeId?: number;
  },
  { transaction }: { transaction: Transaction },
) => {
  try {
    const { currentBalance } = await accountsService.getAccountById(
      { id: accountId, userId },
      { transaction },
    );

    if (previousTransactionTypeId) {
      // Make the previous amount value positive or negative depending on the tx type
      previousAmount = await transformAmountDependingOnTxType({
          amount: previousAmount,
          transactionTypeId: previousTransactionTypeId,
        }, { transaction })
    }

    // Make the current amount value positive or negative depending on the tx type
    amount = await transformAmountDependingOnTxType({
      amount,
      transactionTypeId,
    }, { transaction })

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
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
  transactionEntityId,
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
        transactionTypeId,
        paymentTypeId,
        accountId,
        categoryId,
        transactionEntityId,
      },
      { transaction }
    );

    await updateAccountBalance({
      transactionTypeId,
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
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
  userId,
}) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      transactionTypeId: previousTransactionTypeId,
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
        transactionTypeId,
        paymentTypeId,
        accountId,
        categoryId,
      },
      { transaction },
    );

    await updateAccountBalance(
      {
        transactionTypeId,
        accountId,
        userId,
        amount,
        previousAmount,
        previousTransactionTypeId,
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
      transactionTypeId,
      accountId,
    } = await Transactions.getTransactionById({ id, userId }, { transaction })

    await updateAccountBalance(
      {
        userId,
        accountId,
        transactionTypeId,
        previousTransactionTypeId: transactionTypeId,
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
