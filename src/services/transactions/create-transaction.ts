import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';

import { updateAccountBalance } from './helpers';

export interface CreateTransactionParams {
  authorId: number;
  amount: number;
  note?: string;
  time: string;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  accountType: ACCOUNT_TYPES;
  currencyId: number;
  currencyCode: string;
  isTransfer;
}

export interface CreateTransferTransactionParams {
  destinationAmount?: number;
  destinationAccountId?: number;
  destinationCurrencyId?: number;
  destinationCurrencyCode?: string;
}

/**
 * Creates transaction and updates account balance.
 */
 export const createTransaction = async ({
  authorId,
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  accountType,
  currencyId,
  currencyCode,
  destinationCurrencyId,
  destinationCurrencyCode,
  isTransfer = false,
  destinationAmount,
  destinationAccountId,
  // TODO:
  // destinationCurrencyCode
}: CreateTransactionParams & CreateTransferTransactionParams) => {
  let transaction: Transaction = null;

  transaction = await connection.sequelize.transaction();

  try {
    const generalTxParams = {
      amount,
      refAmount: amount,
      note,
      time,
      authorId,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      accountType,
      currencyId,
      currencyCode,
      isTransfer,
      transferId: undefined,
    };

    let mainTxParams = { ...generalTxParams }
    let transactionsParams = [mainTxParams]

    /**
     * If transactions is transfer, add transferId to both transactions to connect
     * them, and use destinationAmount and destinationAccountId for the second
     * transaction.
     */
    if (isTransfer) {
      const transferId = uuidv4();

      mainTxParams = {
        ...mainTxParams,
        transferId,
        transactionType: TRANSACTION_TYPES.expense,
      }

      const destinationTxParams = {
        ...generalTxParams,
        amount: destinationAmount,
        accountId: destinationAccountId,
        transferId,
        transactionType: TRANSACTION_TYPES.income,
        currencyId: destinationCurrencyId,
        currencyCode: destinationCurrencyCode,
      }

      transactionsParams = [mainTxParams, destinationTxParams]
    }

    const transactions = await Promise.all(
      transactionsParams.map(params => (
        Transactions.createTransaction(
          params,
          { transaction },
        )
      ))
    );

    await Promise.all(
      transactions.map(tx => (
        updateAccountBalance(
          {
            accountId: tx.accountId,
            userId: tx.authorId,
            amount: tx.transactionType === TRANSACTION_TYPES.income
              ? tx.amount
              : tx.amount * -1,
          },
          { transaction },
        )
      ))
    )

    await transaction.commit();

    return transactions;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    await transaction.rollback();
    throw e;
  }
};
