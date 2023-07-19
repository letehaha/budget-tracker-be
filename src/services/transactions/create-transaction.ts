import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';
import * as Accounts from '@models/Accounts.model';
import * as userExchangeRateService from '@services/user-exchange-rate';
import * as UsersCurrencies from '@models/UsersCurrencies.model';

export interface CreateTransactionParams {
  userId: number;
  amount: number;
  note?: string;
  time: Date;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  accountType: ACCOUNT_TYPES;
  isTransfer;
}

export interface CreateTransferTransactionParams {
  destinationAmount?: number;
  destinationAccountId?: number;
}

/**
 * Creates transaction and updates account balance.
 */
 export const createTransaction = async ({
  userId,
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  accountType,
  isTransfer = false,
  destinationAmount,
  destinationAccountId,
}: CreateTransactionParams & CreateTransferTransactionParams) => {
  let transaction: Transaction = null;

  transaction = await connection.sequelize.transaction();

  try {
    const generalTxParams = {
      amount,
      refAmount: amount,
      note,
      time,
      userId,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      accountType,
      currencyId: undefined,
      currencyCode: undefined,
      isTransfer,
      transferId: undefined,
      refCurrencyCode: undefined,
    };

    const { currency: defaultUserCurrency } = await UsersCurrencies.getCurrency(
      { userId, isDefaultCurrency: true },
      { transaction },
    );

    generalTxParams.refCurrencyCode = defaultUserCurrency.code;

    const { currency: generalTxCurrency } = await Accounts.getAccountCurrency({
      userId,
      id: accountId,
    }, { transaction });

    generalTxParams.currencyId = generalTxCurrency.id;
    generalTxParams.currencyCode = generalTxCurrency.code;

    if (defaultUserCurrency.code !== generalTxCurrency.code) {
      const { rate } = await userExchangeRateService.getExchangeRate({
        userId,
        baseCode: generalTxCurrency.code,
        quoteCode: defaultUserCurrency.code,
      }, { transaction })

      generalTxParams.refAmount = Math.max(Math.floor(generalTxParams.amount * rate), 1)
    }

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
        currencyId: undefined,
        currencyCode: undefined,
      }

      const { currency: destinationTxCurrency } = await Accounts.getAccountCurrency({
        userId,
        id: destinationAccountId,
      });

      destinationTxParams.refAmount = generalTxParams.refAmount
      destinationTxParams.currencyId = destinationTxCurrency.id;
      destinationTxParams.currencyCode = destinationTxCurrency.code;

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
