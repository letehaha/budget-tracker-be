import { PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

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
  time?: Date;
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

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      accountId: previousAccountId,
      transactionType: previousTransactionType,
      isTransfer: previouslyItWasTransfer,
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
        // When transfer, base tx can only be "expense'
        transactionType: isTransfer ? TRANSACTION_TYPES.expense : transactionType,
        paymentType,
        accountId,
        categoryId,
        currencyId,
        currencyCode,
        isTransfer,
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
      if (previouslyItWasTransfer) {
        // If previously the base tx was transfer, we need to:
        // 1. Find opposite tx to get access to old tx data
        // 2. Update opposite tx data
        // 3.1. If accountId is the same, just update the balance
        // 3.2. If accountId changed, update new and old accounts balance

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
      } else {
        // If previously the base tx wasn't transfer, so it was income or expense,
        // we need to:
        // 1. create an opposite tx
        // 2. update account balance for the new opposite tx
        // 3. generate "transferId" and put it to both transactions

        if (!destinationAmount || !destinationAccountId || !destinationCurrencyId || !destinationCurrencyCode) {
          throw new ValidationError({
            message: `One of required fields are missing: destinationAmount, destinationAccountId, destinationCurrencyId, destinationCurrencyCode.`,
          })
        }

        const transferId = uuidv4();

        await Transactions.updateTransactionById({
          id: baseTransaction.id,
          authorId: baseTransaction.authorId,
          transferId,
          isTransfer: true,
        }, { transaction });

        const createdTx = await Transactions.createTransaction(
          {
            authorId: baseTransaction.authorId,
            amount: destinationAmount,
            refAmount: destinationAmount,
            note: baseTransaction.note,
            time: new Date(baseTransaction.time),
            // opposite tx can only be income
            transactionType: TRANSACTION_TYPES.income,
            paymentType: baseTransaction.paymentType,
            accountId: destinationAccountId,
            categoryId: baseTransaction.categoryId,
            accountType: baseTransaction.accountType,
            currencyId: destinationCurrencyId,
            currencyCode: destinationCurrencyCode,
            isTransfer: true,
            transferId,
          },
          { transaction },
        );

        await updateAccountBalance(
          {
            accountId: destinationAccountId,
            userId: authorId,
            amount: defineCorrectAmountFromTxType(destinationAmount, TRANSACTION_TYPES.income),
          },
          { transaction },
        );

        updatedTransactions.push(createdTx);
      }
    } else if (!isTransfer && previouslyItWasTransfer) {
      // If right now base tx is not transfer, but previously it was one, we need
      // to:
      // 1. remove old opposite tx
      // 2. remove "trasferId" from base tx
      // 3. update the balance of the account related to opposite tx.

      const notBaseTransaction = (await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        authorId,
      })).find(item => Number(item.id) !== Number(id));

      await Transactions.deleteTransactionById({
        id: notBaseTransaction.id,
        authorId: notBaseTransaction.authorId
      }, { transaction });

      await Transactions.updateTransactionById(
        {
          id: baseTransaction.id,
          authorId: baseTransaction.authorId,
          transferId: null,
          isTransfer: false,
        },
        { transaction },
      );

      await updateAccountBalance(
        {
          accountId: notBaseTransaction.accountId,
          userId: authorId,
          amount: 0,
          previousAmount: defineCorrectAmountFromTxType(notBaseTransaction.amount, TRANSACTION_TYPES.income),
        },
        { transaction },
      );
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
