import { Transaction } from 'sequelize/types';
import { TRANSACTION_TYPES, ERROR_CODES } from 'shared-types'

import { connection } from '@models/index';
import { UnexpectedError } from '@js/errors'
import * as Transactions from '@models/Transactions.model';
import * as accountsService from '@services/accounts.service';
import * as transactionTypesService from '@services/transaction-types.service'

/**
 * Updates the balance of the account associated with the transaction
 */
export const updateAccountBalance = async (
  {
    transactionTypeId,
    accountId,
    userId,
    amount,
    oldAmount,
  }: {
    transactionTypeId: number;
    accountId: number;
    userId: number;
    amount: number;
    oldAmount?: number;
  },
  { transaction }: { transaction: Transaction },
) => {
  try {
    let newAmount = amount
    const previousAmount = oldAmount ?? newAmount

    // If transaction type is not TRANSACTION_TYPES.income, make amount negative
    const transactionType = await transactionTypesService.getTransactionTypeById(
      transactionTypeId,
      { transaction },
    );
    const isIncome = transactionType.type === TRANSACTION_TYPES.income
    if (!isIncome) newAmount *= -1

    const { currentBalance } = await accountsService.getAccountById(
      { id: accountId, userId },
      { transaction },
    );

    let newBalance = currentBalance

    if (newAmount > previousAmount) {
      newBalance = currentBalance + (newAmount - previousAmount)
    } else if (newAmount < previousAmount) {
      newBalance = currentBalance - (previousAmount - newAmount)
    } else {
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
    throw e
  }
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
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const { amount: oldAmount } = await Transactions.getTransactionById(
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
        oldAmount,
      },
      { transaction },
    )

    await transaction.commit();

    return data
  } catch (e) {
    await transaction.rollback();
    throw e
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
      amount: oldAmount,
      transactionTypeId,
      accountId,
    } = await Transactions.getTransactionById({ id, userId }, { transaction })

    console.log('oldAmount', oldAmount);

    await updateAccountBalance(
      {
        userId,
        accountId,
        transactionTypeId,
        // make new amount 0, so the balance won't depend on this tx anymore
        amount: 0,
        oldAmount,
      },
      { transaction },
    )

    await Transactions.deleteTransactionById({ id, userId }, { transaction });

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e
  }
};
