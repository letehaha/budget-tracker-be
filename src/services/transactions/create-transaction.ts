import { ACCOUNT_TYPES, TRANSACTION_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { Transaction } from 'sequelize/types';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes, UnwrapPromise } from '@common/types';
import { ValidationError } from '@js/errors';

import * as Transactions from '@models/Transactions.model';
import * as Accounts from '@models/Accounts.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';

import { linkTransactions } from './transactions-linking';
import type { CreateTransactionParams, UpdateTransactionParams } from './types';

import { createSingleRefund } from '../tx-refunds/create-single-refund.service';

type CreateOppositeTransactionParams = [
  creationParams: CreateTransactionParams | UpdateTransactionParams,
  baseTransaction: Transactions.default,
  sequelizeTransaction: Transaction,
];

/**
 * Calculate oppositeTx based on baseTx amount and currency.
 *
 * *ref-transaction - transaction with ref-currency, means user's base currency
 *
 * 1. If source transaction is a ref-transaction, and opposite is non-ref,
 *    then opposite's refAmount should be the same as of source
 * 2. If source tx is a non-ref, and opposite is ref - then source's
 *    refAmount should be the same as opposite. We update its value right in that
 *    helper and return it back
 * 3. If both are ref, then they both should have same refAmount
 * 4. If both are non-ref, then each of them has separate refAmount. So we don't
 *    touch source tx, and calculate refAmount for opposite tx
 *
 */
export const calcTransferTransactionRefAmount = async (
  {
    userId,
    baseTransaction,
    destinationAmount,
    oppositeTxCurrencyCode,
    baseCurrency,
  }: {
    userId: number;
    baseTransaction: Transactions.default;
    destinationAmount: number;
    oppositeTxCurrencyCode: string;
    baseCurrency?: UnwrapPromise<ReturnType<typeof UsersCurrencies.getBaseCurrency>>;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  if (!baseCurrency) {
    baseCurrency = await UsersCurrencies.getBaseCurrency({ userId }, { transaction });
  }

  const isSourceRef = baseTransaction.currencyCode === baseCurrency.currency.code;
  const isOppositeRef = oppositeTxCurrencyCode === baseCurrency.currency.code;

  let oppositeRefAmount = destinationAmount;

  if (isSourceRef && !isOppositeRef) {
    oppositeRefAmount = baseTransaction.refAmount;
  } else if (!isSourceRef && isOppositeRef) {
    baseTransaction = await Transactions.updateTransactionById(
      {
        id: baseTransaction.id,
        userId,
        refAmount: destinationAmount,
      },
      { transaction },
    );
    oppositeRefAmount = destinationAmount;
  } else if (isSourceRef && isOppositeRef) {
    oppositeRefAmount = baseTransaction.refAmount;
  } else if (!isSourceRef && !isOppositeRef) {
    oppositeRefAmount = await calculateRefAmount(
      {
        userId,
        amount: destinationAmount,
        baseCode: oppositeTxCurrencyCode,
        quoteCode: baseCurrency.currency.code,
      },
      { transaction },
    );
  }

  return {
    oppositeRefAmount,
    baseTransaction,
  };
};

/**
 * If previously the base tx wasn't transfer, so it was income or expense, we need to:
 *
 * 1. create an opposite tx
 * 2. generate "transferId" and put it to both transactions
 * 3. Calculate correct refAmount for both base and opposite tx. Logic is described down in the code
 */
export const createOppositeTransaction = async (params: CreateOppositeTransactionParams) => {
  const [creationParams, baseTransaction, transaction] = params;

  const { destinationAmount, destinationAccountId, userId, transactionType } = creationParams;

  if (!destinationAmount || !destinationAccountId) {
    throw new ValidationError({
      message: `One of required fields are missing: destinationAmount, destinationAccountId.`,
    });
  }

  const transferId = uuidv4();

  let baseTx = await Transactions.updateTransactionById(
    {
      id: baseTransaction.id,
      userId: baseTransaction.userId,
      transferId,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
    },
    { transaction },
  );

  const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
    userId,
    id: destinationAccountId,
  });

  const defaultUserCurrency = await UsersCurrencies.getBaseCurrency({ userId }, { transaction });

  const { oppositeRefAmount, baseTransaction: updatedBaseTransaction } =
    await calcTransferTransactionRefAmount(
      {
        userId,
        baseTransaction: baseTx,
        destinationAmount,
        oppositeTxCurrencyCode: oppositeTxCurrency.code,
        baseCurrency: defaultUserCurrency,
      },
      { transaction },
    );

  baseTx = updatedBaseTransaction;

  const oppositeTx = await Transactions.createTransaction(
    {
      userId: baseTransaction.userId,
      amount: destinationAmount,
      refAmount: oppositeRefAmount,
      note: baseTransaction.note,
      time: new Date(baseTransaction.time),
      transactionType:
        transactionType === TRANSACTION_TYPES.income
          ? TRANSACTION_TYPES.expense
          : TRANSACTION_TYPES.income,
      paymentType: baseTransaction.paymentType,
      accountId: destinationAccountId,
      categoryId: baseTransaction.categoryId,
      accountType: ACCOUNT_TYPES.system,
      currencyId: oppositeTxCurrency.id,
      currencyCode: oppositeTxCurrency.code,
      refCurrencyCode: defaultUserCurrency.currency.code,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
      transferId,
    },
    { transaction },
  );

  return { baseTx, oppositeTx };
};

/**
 * Creates transaction and updates account balance.
 */
export const createTransaction = async (
  {
    amount,
    userId,
    accountId,
    transferNature,
    destinationTransactionId,
    refundsTxId,
    ...payload
  }: CreateTransactionParams,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction: Transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    if (refundsTxId && transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer) {
      throw new ValidationError({
        message:
          'It is not allowed to crate a transaction that is a refund and a transfer at the same time',
      });
    }

    const generalTxParams: Transactions.CreateTransactionPayload = {
      ...payload,
      amount,
      userId,
      accountId,
      transferNature,
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

    const { currency: generalTxCurrency } = await Accounts.getAccountCurrency(
      {
        userId,
        id: accountId,
      },
      { transaction },
    );

    generalTxParams.currencyId = generalTxCurrency.id;
    generalTxParams.currencyCode = generalTxCurrency.code;

    if (defaultUserCurrency.code !== generalTxCurrency.code) {
      generalTxParams.refAmount = await calculateRefAmount(
        {
          userId,
          amount: generalTxParams.amount,
          baseCode: generalTxCurrency.code,
          quoteCode: defaultUserCurrency.code,
        },
        { transaction },
      );
    }

    const baseTransaction = await Transactions.createTransaction(generalTxParams, { transaction });

    let transactions: [baseTx: Transactions.default, oppositeTx?: Transactions.default] = [
      baseTransaction,
    ];

    if (refundsTxId && transferNature !== TRANSACTION_TRANSFER_NATURE.common_transfer) {
      await createSingleRefund(
        { userId, originalTxId: refundsTxId, refundTxId: baseTransaction.id },
        { transaction },
      );
    } else if (transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer) {
      /**
       * If transaction is transfer between two accounts, add transferId to both
       * transactions to connect them, and use destinationAmount and destinationAccountId
       * for the second transaction.
       */

      if (destinationTransactionId) {
        /**
         * When "destinationTransactionId" is provided, we don't need to create an
         * opposite transaction, since it's expected to use the existing one.
         * We need to update the existing one, or fail the whole creation if it
         * doesn't exist
         */
        const [[baseTx, oppositeTx]] = await linkTransactions(
          {
            userId,
            ids: [[baseTransaction.id, destinationTransactionId]],
            ignoreBaseTxTypeValidation: true,
          },
          { transaction },
        );

        transactions = [baseTx, oppositeTx];
      } else {
        const res = await createOppositeTransaction([
          {
            amount,
            userId,
            accountId,
            transferNature,
            ...payload,
          },
          baseTransaction,
          transaction,
        ]);
        transactions = [res.baseTx, res.oppositeTx];
      }
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
