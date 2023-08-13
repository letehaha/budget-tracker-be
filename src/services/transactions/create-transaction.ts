import { TRANSACTION_TYPES } from 'shared-types'
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';

import * as Transactions from '@models/Transactions.model';
import * as Accounts from '@models/Accounts.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';

type CreateTransactionParams = Omit<Transactions.CreateTransactionPayload, 'refAmount' | 'currencyId' | 'currencyCode' | 'transferId' | 'refCurrencyCode'>

/**
 * Creates transaction and updates account balance.
 */
 export const createTransaction = async (
  {
    amount,
    userId,
    accountId,
    isTransfer,
    destinationAmount,
    destinationAccountId,
    ...payload
  }: CreateTransactionParams & {
    destinationAmount?: number;
    destinationAccountId?: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    const generalTxParams: Transactions.CreateTransactionPayload = {
      ...payload,
      amount,
      userId,
      accountId,
      isTransfer,
      refAmount: amount,
      // since we already pass accountId, we don't need currencyId (at least for now)
      currencyId: undefined,
      currencyCode: undefined,
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
      generalTxParams.refAmount = await calculateRefAmount({
        userId,
        amount: generalTxParams.amount,
        baseCode: generalTxCurrency.code,
        quoteCode: defaultUserCurrency.code,
      }, { transaction });
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

      // "destination" tx should always have same `refAmount` so it won't produce
      // any conflicts. TODO: improve explanation
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

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return transactions;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw e;
  }
};
