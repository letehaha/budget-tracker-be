import { ACCOUNT_TYPES, PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

import { logger} from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as Accounts from '@models/Accounts.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';

import { getTransactionById } from './get-by-id';

interface UpdateParams {
  id: number;
  userId: number;
  amount?: number;
  note?: string;
  time?: Date;
  transactionType?: TRANSACTION_TYPES;
  paymentType?: PAYMENT_TYPES;
  accountId?: number;
  categoryId?: number;
  isTransfer?: boolean;
}

interface UpdateTransferParams {
  destinationAmount?: number;
  destinationAccountId?: number;
  isTransfer?: boolean;
}

export const EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS = ['amount', 'time', 'transactionType', 'accountId'];

/**
 * 1. Do not allow editing specified fields
 * 2. Do now allow editing non-source transaction (TODO: except it's an external one)
 */
const validateTransaction = (newData: UpdateParams & UpdateTransferParams, prevData: Transactions.default) => {
  if (+newData.id !== +prevData.id) throw new ValidationError({ message: 'id cannot be changed' })

  if (prevData.accountType !== ACCOUNT_TYPES.system) {
    if (EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS.some(field => newData[field] !== undefined)) {
      throw new ValidationError({ message: 'Attempt to edit readonly fields of the external account' });
    }
  }

  if (
    newData.transactionType
    && prevData.accountType !== ACCOUNT_TYPES.system
    && newData.transactionType !== prevData.transactionType
  ) {
    throw new ValidationError({ message: 'It\'s disallowed to change "transactionType" of the non-system account' });
  }

  // We doesn't allow users to change non-source trasnaction for several reasons:
  // 1. Most importantly – to make things simpler. For now there's no case that
  //    exactly non-source tx should be changed, so it's just easier to not
  //    code that logic
  // 2. To keep `refAmount` calculation correct abd be tied exactly to source tx.
  //    Otherwise we will need to code additional logic to handle that
  // For now keep that logic only for system transactions
  if (
    prevData.accountType === ACCOUNT_TYPES.system
    && prevData.isTransfer
    && prevData.transactionType !== TRANSACTION_TYPES.expense
  ) {
    throw new ValidationError({ message: 'You cannot edit non-primary transfer transaction' });
  }
};

const makeBasicBaseTxUpdation = async (
  newData: UpdateParams & UpdateTransferParams,
  prevData: Transactions.default,
  transaction: Transaction,
) => {
  const { currency: defaultUserCurrency } = await UsersCurrencies.getCurrency(
    { userId: newData.userId, isDefaultCurrency: true },
    { transaction },
  );

  const transactionType = prevData.accountType === ACCOUNT_TYPES.system
    // For system
    ? newData.isTransfer ? TRANSACTION_TYPES.expense : newData.transactionType
    : prevData.transactionType;

  const baseTransactionUpdateParams: Transactions.UpdateTransactionByIdParams = {
    id: newData.id,
    amount: newData.amount ?? prevData.amount,
    refAmount: newData.amount ?? prevData.refAmount,
    note: newData.note,
    time: newData.time,
    userId: newData.userId,
    transactionType,
    paymentType: newData.paymentType,
    accountId: newData.accountId,
    categoryId: newData.categoryId,
    isTransfer: newData.isTransfer,
    currencyCode: prevData.currencyCode,
  }

  const isBaseTxAccountChanged = newData.accountId && newData.accountId !== prevData.accountId;

  if (isBaseTxAccountChanged) {
    // Since accountId is changed, we need to change currency too
    const { currency: baseTxCurrency } = await Accounts.getAccountCurrency({
      userId: newData.userId,
      id: Number(newData.accountId),
    });

    baseTransactionUpdateParams.currencyId = baseTxCurrency.id
    baseTransactionUpdateParams.currencyCode = baseTxCurrency.code
  }

  if (defaultUserCurrency.code !== baseTransactionUpdateParams.currencyCode) {
    baseTransactionUpdateParams.refAmount = await calculateRefAmount({
      userId: newData.userId,
      amount: baseTransactionUpdateParams.amount,
      baseCode: baseTransactionUpdateParams.currencyCode,
      quoteCode: defaultUserCurrency.code,
    }, { transaction });
  }

  const baseTransaction = await Transactions.updateTransactionById(
    baseTransactionUpdateParams,
    { transaction },
  );

  return baseTransaction;
};

type HelperFunctionsArgs = [UpdateParams & UpdateTransferParams, Transactions.default, Transactions.default, Transaction];

/**
 * If previously the base tx was transfer, we need to::
 *
 * 1. Find opposite tx to get access to old tx data
 * 2. Update opposite tx data
 */
const updateTransferTransaction = async (params: HelperFunctionsArgs) => {
  const [newData, prevData, baseTransaction, transaction] = params;

  const {
    userId,
    destinationAmount,
    note,
    time,
    accountId,
    paymentType,
    destinationAccountId,
    categoryId,
  } = newData;

  const oppositeTx = (await Transactions.getTransactionsByArrayOfField({
    fieldValues: [prevData.transferId],
    fieldName: 'transferId',
    userId,
  })).find(item => Number(item.id) !== Number(newData.id));

  const destinationTransaction = await Transactions.updateTransactionById(
    {
      id: oppositeTx.id,
      userId,
      amount: destinationAmount,
      refAmount: baseTransaction.refAmount,
      transactionType: TRANSACTION_TYPES.income,
      accountId: destinationAccountId,
      note,
      time,
      paymentType,
      categoryId,
    },
    { transaction },
  );

  // If accountId was changed to a new one
  if (destinationAccountId && destinationAccountId !== oppositeTx.accountId) {
    // Since accountId is changed, we need to change currency too
    const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
      userId,
      id: accountId,
    });
    await Transactions.updateTransactionById(
      {
        id: oppositeTx.id,
        userId,
        currencyId: oppositeTxCurrency.id,
        currencyCode: oppositeTxCurrency.code,
      },
      { transaction },
    );
  }

  return destinationTransaction;
}

/**
 * If previously the base tx wasn't transfer, so it was income or expense, we need to:
 *
 * 1. create an opposite tx
 * 2. generate "transferId" and put it to both transactions
 */
const createOppositeTransaction = async (
  params: HelperFunctionsArgs,
): Promise<[baseTx: Transactions.default, oppositeTx: Transactions.default]> => {
  const [newData, prevData, baseTransaction, transaction] = params;

  const { destinationAmount, destinationAccountId, userId } = newData;

  if (!destinationAmount || !destinationAccountId) {
    throw new ValidationError({
      message: `One of required fields are missing: destinationAmount, destinationAccountId.`,
    })
  }

  const transferId = uuidv4();

  const baseTx = await Transactions.updateTransactionById({
    id: baseTransaction.id,
    userId: baseTransaction.userId,
    transferId,
    isTransfer: true,
  }, { transaction });

  const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
    userId,
    id: destinationAccountId,
  });

  const oppositeTx = await Transactions.createTransaction(
    {
      userId: baseTransaction.userId,
      amount: destinationAmount,
      // opposite_tx should always have refAmount same as base_tx refAmount, because
      // only the base_tx in the source of truth for the analytics
      refAmount: baseTransaction.refAmount,
      note: baseTransaction.note,
      time: new Date(baseTransaction.time),
      transactionType: prevData.transactionType === TRANSACTION_TYPES.income
        ? TRANSACTION_TYPES.expense
        : TRANSACTION_TYPES.income,
      paymentType: baseTransaction.paymentType,
      accountId: destinationAccountId,
      categoryId: baseTransaction.categoryId,
      accountType: ACCOUNT_TYPES.system,
      currencyId: oppositeTxCurrency.id,
      currencyCode: oppositeTxCurrency.code,
      isTransfer: true,
      transferId,
    },
    { transaction },
  );

  return [baseTx, oppositeTx];
}

/**
 * If right now base tx is not transfer, but previously it was one, we need to:
 *
 * 1. remove old opposite tx
 * 2. remove "trasferId" from base tx
 */
const deleteOppositeTransaction = async (params: HelperFunctionsArgs) => {
  const [newData, prevData, baseTransaction, transaction] = params;

  const notBaseTransaction = (await Transactions.getTransactionsByArrayOfField({
    fieldValues: [prevData.transferId],
    fieldName: 'transferId',
    userId: newData.userId,
  })).find(item => Number(item.id) !== Number(newData.id));

  await Transactions.deleteTransactionById({
    id: notBaseTransaction.id,
    userId: notBaseTransaction.userId
  }, { transaction });

  await Transactions.updateTransactionById(
    {
      id: baseTransaction.id,
      userId: baseTransaction.userId,
      transferId: null,
      isTransfer: false,
    },
    { transaction },
  );
};

/**
 * Updates transaction and updates account balance.
 */
 export const updateTransaction = async (payload: UpdateParams & UpdateTransferParams) => {
  const transaction: Transaction = await connection.sequelize.transaction();

  try {
    const prevData = await getTransactionById(
      { id: payload.id, userId: payload.userId },
      { transaction },
    );

    // Validate that passed parameters are not breaking anything
    validateTransaction(payload, prevData);

    // Make basic updation to the base transaction. "Transfer" transactions
    // handled down in the code
    const baseTransaction = await makeBasicBaseTxUpdation(payload, prevData, transaction);

    let updatedTransactions: [Transactions.default, Transactions.default?] = [baseTransaction];

    const helperFunctionsArgs: HelperFunctionsArgs = [payload, prevData, baseTransaction, transaction];
    if (payload.isTransfer) {
      if (prevData.isTransfer) {
        const oppositeTx = await updateTransferTransaction(helperFunctionsArgs);
        updatedTransactions[1] = oppositeTx;
      } else {
        const [baseTx, oppositeTx] = await createOppositeTransaction(helperFunctionsArgs);
        updatedTransactions = [baseTx, oppositeTx];
      }
    } else if (!payload.isTransfer && prevData.isTransfer) {
      await deleteOppositeTransaction(helperFunctionsArgs);
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
