import { ACCOUNT_TYPES, TRANSACTION_TYPES } from 'shared-types'
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { Transaction } from 'sequelize/types';
import { logger} from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import { ValidationError } from '@js/errors';

import * as Transactions from '@models/Transactions.model';
import * as Accounts from '@models/Accounts.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';

import type { CreateTransactionParams, UpdateTransactionParams } from './types';

type CreateOppositeTransactionParams = [
  creationParams: CreateTransactionParams | UpdateTransactionParams,
  baseTransaction: Transactions.default,
  sequelizeTransaction: Transaction,
];

/**
 * If previously the base tx wasn't transfer, so it was income or expense, we need to:
 *
 * 1. create an opposite tx
 * 2. generate "transferId" and put it to both transactions
 * 3. Calculate correct refAmount for both base and opposite tx. Logic is described down in the code
 */
export const createOppositeTransaction = async (
  params: CreateOppositeTransactionParams,
): Promise<[baseTx: Transactions.default, oppositeTx: Transactions.default]> => {
  const [creationParams, baseTransaction, transaction] = params;

  const { destinationAmount, destinationAccountId, userId, transactionType } = creationParams;

  if (!destinationAmount || !destinationAccountId) {
    throw new ValidationError({
      message: `One of required fields are missing: destinationAmount, destinationAccountId.`,
    })
  }

  const transferId = uuidv4();

  let baseTx = await Transactions.updateTransactionById({
    id: baseTransaction.id,
    userId: baseTransaction.userId,
    transferId,
    isTransfer: true,
  }, { transaction });

  const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
    userId,
    id: destinationAccountId,
  });

  const { currency: defaultUserCurrency } = await UsersCurrencies.getCurrency(
    { userId, isDefaultCurrency: true },
    { transaction },
  );

  let refAmount = baseTransaction.refAmount;
  const isBaseTxCurrencyRef = baseTransaction.currencyId === defaultUserCurrency.id;
  const isOppositeTxCurrencyRef = oppositeTxCurrency.id === defaultUserCurrency.id;

  if (!isBaseTxCurrencyRef && !isOppositeTxCurrencyRef) {
    // if source tx non-ref, opposite also non-ref, each one uses their ref. it's oke if ref-balance will be unsynced
    refAmount = await calculateRefAmount({
      userId,
      amount: destinationAmount,
      baseCode: oppositeTxCurrency.code,
      quoteCode: defaultUserCurrency.code,
    }, { transaction });
  } else if (!isBaseTxCurrencyRef && isOppositeTxCurrencyRef) {
    // if source tx non-ref, opposite is ref, then source should use opposite's ref
    refAmount = destinationAmount;

    baseTx = await Transactions.updateTransactionById({
      id: baseTransaction.id,
      userId: baseTransaction.userId,
      refAmount: destinationAmount,
    }, { transaction });
  } else if (isBaseTxCurrencyRef && !isOppositeTxCurrencyRef) {
    // if source is ref, opposite is non-ref, then opposite should use base's ref
    refAmount = baseTransaction.refAmount;
  } else if (isBaseTxCurrencyRef && isOppositeTxCurrencyRef) {
    // if source is ref, opposite is ref, then same ref
    refAmount = baseTransaction.refAmount;
  }

  const oppositeTx = await Transactions.createTransaction(
    {
      userId: baseTransaction.userId,
      amount: destinationAmount,
      // opposite_tx should always have refAmount same as base_tx refAmount, because
      // only the base_tx in the source of truth for the analytics
      refAmount,
      note: baseTransaction.note,
      time: new Date(baseTransaction.time),
      transactionType: transactionType === TRANSACTION_TYPES.income
        ? TRANSACTION_TYPES.expense
        : TRANSACTION_TYPES.income,
      paymentType: baseTransaction.paymentType,
      accountId: destinationAccountId,
      categoryId: baseTransaction.categoryId,
      accountType: ACCOUNT_TYPES.system,
      currencyId: oppositeTxCurrency.id,
      currencyCode: oppositeTxCurrency.code,
      refCurrencyCode: defaultUserCurrency.code,
      isTransfer: true,
      transferId,
    },
    { transaction },
  );

  return [baseTx, oppositeTx];
}

/**
 * Creates transaction and updates account balance.
 */
 export const createTransaction = async (
  {
    amount,
    userId,
    accountId,
    isTransfer,
    ...payload
  }: CreateTransactionParams,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction: Transaction = attributes.transaction ?? await connection.sequelize.transaction();

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

    const baseTransaction = await Transactions.createTransaction(
      generalTxParams,
      { transaction },
    );

    let transactions: [baseTx: Transactions.default, oppositeTx?: Transactions.default] = [baseTransaction];

    /**
     * If transactions is transfer, add transferId to both transactions to connect
     * them, and use destinationAmount and destinationAccountId for the second
     * transaction.
     */
    if (isTransfer) {
      transactions = await createOppositeTransaction([
        {
          amount,
          userId,
          accountId,
          isTransfer,
          ...payload
        },
        baseTransaction,
        transaction,
      ]);
    }

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
