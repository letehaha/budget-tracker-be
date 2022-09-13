import { PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';

import { logger} from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';

import { getTransactionById } from './get-by-id';
import { updateAccountBalance } from './helpers';

const defineCorrectAmountFromTxType = (amount: number, transactionType: TRANSACTION_TYPES) => {
  return transactionType === TRANSACTION_TYPES.income
    ? amount
    : amount * -1
};

interface UpdateParams {
  id: number;
  authorId: number;
  amount?: number;
  note?: string;
  time?: string;
  transactionType?: TRANSACTION_TYPES;
  paymentType?: PAYMENT_TYPES;
  accountId?: number;
  categoryId?: number;
  currencyId?: number;
  currencyCode?: string;
  isTransfer?: boolean;
}

interface UpdateTransferParams {
  destinationAmount?: number;
  destinationAccountId?: number;
  destinationCurrencyId?: number;
  destinationCurrencyCode?: string;
}

/**
 * Updates transaction and updates account balance.
 */
 export const updateTransaction = async ({
  id,
  authorId,
  amount,
  destinationAmount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  isTransfer = false,
  currencyId,
  currencyCode,
  destinationAccountId,
  destinationCurrencyId,
  destinationCurrencyCode,
}: UpdateParams & UpdateTransferParams) => {
  let transaction: Transaction = null;

  // amount changed = we change amount in both transactions
  // destinationAmount changed = need to update only second transaction
  // note, time, paymentType changed = both
  // transactionType =
  //                  from expense/income to transfer - ask for destionation- fields, create second tx
  //                  from transfer - remove second transfer transaction, clear base transaction (remove/edit transfer related fields)
  // accountId - change only base
  // destinationAccountId - change only second tx
  // currencyId + code - change only base, same about destination
  // categoryId - change only base if it is not a transefer (add validation)

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      accountId: previousAccountId,
      transactionType: previousTransactionType,
      transferId,
    } = await getTransactionById(
      { id, authorId },
      { transaction },
    );

    if (isTransfer && transactionType !== TRANSACTION_TYPES.expense) {
      throw new ValidationError({ message: 'You cannot edit non-primary transfer transaction' });
    }

    const updatedTransactions = []

    const baseTransaction = await Transactions.updateTransactionById(
      {
        id,
        amount,
        refAmount: amount,
        note,
        time,
        authorId,
        transactionType,
        paymentType,
        accountId,
        categoryId,
        currencyId,
        currencyCode,
      },
      { transaction },
    );

    // If accountId was changed to a new one
    if (accountId && accountId !== previousAccountId) {
      // Make previous account's balance if like there was no transaction before
      await updateAccountBalance(
        {
          accountId: previousAccountId,
          userId: authorId,
          amount: 0,
          previousAmount: defineCorrectAmountFromTxType(previousAmount, previousTransactionType),
        },
        { transaction },
      );

      // Update balance for the new account
      await updateAccountBalance(
        {
          accountId,
          userId: authorId,
          amount: defineCorrectAmountFromTxType(amount, transactionType),
          previousAmount: 0,
        },
        { transaction },
      );
    } else {
      // Update balance for the new account
      await updateAccountBalance(
        {
          accountId,
          userId: authorId,
          amount: defineCorrectAmountFromTxType(amount, transactionType),
          previousAmount: defineCorrectAmountFromTxType(previousAmount, previousTransactionType),
        },
        { transaction },
      );
    }

    updatedTransactions.push(baseTransaction)

    if (isTransfer) {
      // TODO: validate that passed id relates EXACTLY to BASE transaction ('expense')
      const notBaseTransaction = (await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        authorId,
      })).find(item => Number(item.id) !== Number(id));

      const destinationTransaction = await Transactions.updateTransactionById(
        {
          id: notBaseTransaction.id,
          amount: destinationAmount,
          refAmount: destinationAmount,
          note,
          time,
          authorId,
          transactionType: TRANSACTION_TYPES.income,
          paymentType: paymentType,
          accountId: destinationAccountId,
          categoryId,
          currencyId: destinationCurrencyId,
          currencyCode: destinationCurrencyCode,
        },
        { transaction },
      );

      // If accountId was changed to a new one
      if (destinationAccountId && destinationAccountId !== notBaseTransaction.accountId) {
        // Make previous account's balance if like there was no transaction before
        await updateAccountBalance(
          {
            accountId: notBaseTransaction.accountId,
            userId: authorId,
            amount: 0,
            previousAmount: defineCorrectAmountFromTxType(notBaseTransaction.amount, TRANSACTION_TYPES.income),
          },
          { transaction },
        );

        // Update balance for the new account
        await updateAccountBalance(
          {
            accountId,
            userId: authorId,
            amount: defineCorrectAmountFromTxType(destinationAmount, TRANSACTION_TYPES.income),
            previousAmount: 0,
          },
          { transaction },
        );
      } else {
        // Update balance for the new account
        await updateAccountBalance(
          {
            accountId: destinationAccountId,
            userId: authorId,
            amount: defineCorrectAmountFromTxType(destinationAmount, TRANSACTION_TYPES.income),
            previousAmount: defineCorrectAmountFromTxType(notBaseTransaction.amount, TRANSACTION_TYPES.income),
          },
          { transaction },
        );
      }

      updatedTransactions.push(destinationTransaction)
    }

    await transaction.commit();

    return updatedTransactions;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    await transaction.rollback();
    throw e;
  }
};
