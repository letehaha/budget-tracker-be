import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_TRANSFER_NATURE,
} from 'shared-types';
import { Transaction } from 'sequelize/types';
import { logger } from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as Accounts from '@models/Accounts.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import { getTransactionById } from './get-by-id';
import {
  createOppositeTransaction,
  calcTransferTransactionRefAmount,
} from './create-transaction';
import { linkTransactions } from './link-transaction';
import { type UpdateTransactionParams } from './types';
import { removeUndefinedKeys } from '@js/helpers';

export const EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS = [
  'amount',
  'time',
  'transactionType',
  'accountId',
];

/**
 * 1. Do not allow editing specified fields
 * 2. Do now allow editing non-source transaction (TODO: except it's an external one)
 */
const validateTransaction = (
  newData: UpdateTransactionParams,
  prevData: Transactions.default,
) => {
  if (+newData.id !== +prevData.id)
    throw new ValidationError({ message: 'id cannot be changed' });

  if (prevData.accountType !== ACCOUNT_TYPES.system) {
    if (
      EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS.some(
        (field) => newData[field] !== undefined,
      )
    ) {
      throw new ValidationError({
        message: 'Attempt to edit readonly fields of the external account',
      });
    }
  }

  if (
    newData.transactionType &&
    prevData.accountType !== ACCOUNT_TYPES.system &&
    newData.transactionType !== prevData.transactionType
  ) {
    throw new ValidationError({
      message:
        'It\'s disallowed to change "transactionType" of the non-system account',
    });
  }

  // We doesn't allow users to change non-source trasnaction for several reasons:
  // 1. Most importantly – to make things simpler. For now there's no case that
  //    exactly non-source tx should be changed, so it's just easier to not
  //    code that logic
  // 2. To keep `refAmount` calculation correct abd be tied exactly to source tx.
  //    Otherwise we will need to code additional logic to handle that
  // For now keep that logic only for system transactions
  if (
    prevData.accountType === ACCOUNT_TYPES.system &&
    prevData.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer &&
    prevData.transactionType !== TRANSACTION_TYPES.expense
  ) {
    throw new ValidationError({
      message: 'You cannot edit non-primary transfer transaction',
    });
  }
};

const makeBasicBaseTxUpdation = async (
  newData: UpdateTransactionParams,
  prevData: Transactions.default,
  transaction: Transaction,
) => {
  const { currency: defaultUserCurrency } = await UsersCurrencies.getCurrency(
    { userId: newData.userId, isDefaultCurrency: true },
    { transaction },
  );

  const transactionType =
    prevData.accountType === ACCOUNT_TYPES.system
      ? // For system
      newData.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer
        ? TRANSACTION_TYPES.expense
        : newData.transactionType
      : prevData.transactionType;

  const baseTransactionUpdateParams: Transactions.UpdateTransactionByIdParams =
  {
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
    transferNature: newData.transferNature,
    currencyCode: prevData.currencyCode,
  };

  const isBaseTxAccountChanged =
    newData.accountId && newData.accountId !== prevData.accountId;

  if (isBaseTxAccountChanged) {
    // Since accountId is changed, we need to change currency too
    const { currency: baseTxCurrency } = await Accounts.getAccountCurrency({
      userId: newData.userId,
      id: Number(newData.accountId),
    });

    baseTransactionUpdateParams.currencyId = baseTxCurrency.id;
    baseTransactionUpdateParams.currencyCode = baseTxCurrency.code;
  }

  if (defaultUserCurrency.code !== baseTransactionUpdateParams.currencyCode) {
    baseTransactionUpdateParams.refAmount = await calculateRefAmount(
      {
        userId: newData.userId,
        amount: baseTransactionUpdateParams.amount,
        baseCode: baseTransactionUpdateParams.currencyCode,
        quoteCode: defaultUserCurrency.code,
      },
      { transaction },
    );
  }

  const baseTransaction = await Transactions.updateTransactionById(
    baseTransactionUpdateParams,
    { transaction },
  );

  return baseTransaction;
};

type HelperFunctionsArgs = [
  UpdateTransactionParams,
  Transactions.default,
  Transactions.default,
  Transaction,
];

/**
 * If previously the base tx was transfer, we need to:
 *
 * 1. Find opposite tx to get access to old tx data
 * 2. Update opposite tx data
 */
const updateTransferTransaction = async (params: HelperFunctionsArgs) => {
  const [newData, prevData, , transaction] = params;
  let [, , baseTransaction] = params;

  const {
    userId,
    destinationAmount,
    note,
    time,
    paymentType,
    destinationAccountId,
    categoryId,
  } = newData;

  const oppositeTx = (
    await Transactions.getTransactionsByArrayOfField({
      fieldValues: [prevData.transferId],
      fieldName: 'transferId',
      userId,
    })
  ).find((item) => Number(item.id) !== Number(newData.id));

  let updateOppositeTxParams = removeUndefinedKeys({
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
    currencyId: oppositeTx.currencyId,
    currencyCode: oppositeTx.currencyCode,
  });

  // If accountId was changed to a new one
  if (destinationAccountId && destinationAccountId !== oppositeTx.accountId) {
    // Since destinationAccountId is changed, we need to change currency too
    const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
      userId,
      id: destinationAccountId,
    });

    updateOppositeTxParams = {
      ...updateOppositeTxParams,
      currencyId: oppositeTxCurrency.id,
      currencyCode: oppositeTxCurrency.code,
    };
  }

  const { oppositeRefAmount, baseTransaction: updatedBaseTransaction } =
    await calcTransferTransactionRefAmount(
      {
        userId,
        baseTransaction,
        destinationAmount: updateOppositeTxParams.amount,
        oppositeTxCurrencyCode: updateOppositeTxParams.currencyCode,
      },
      { transaction },
    );

  updateOppositeTxParams.refAmount = oppositeRefAmount;
  baseTransaction = updatedBaseTransaction;

  const destinationTransaction = await Transactions.updateTransactionById(
    updateOppositeTxParams,
    { transaction },
  );

  return { baseTx: baseTransaction, oppositeTx: destinationTransaction };
};

/**
 * If right now base tx is not transfer, but previously it was one, we need to:
 *
 * 1. remove old opposite tx
 * 2. remove "trasferId" from base tx
 */
const deleteOppositeTransaction = async (params: HelperFunctionsArgs) => {
  const [newData, prevData, baseTransaction, transaction] = params;

  const notBaseTransaction = (
    await Transactions.getTransactionsByArrayOfField({
      fieldValues: [prevData.transferId],
      fieldName: 'transferId',
      userId: newData.userId,
    })
  ).find((item) => Number(item.id) !== Number(newData.id));

  if (notBaseTransaction) {
    await Transactions.deleteTransactionById(
      {
        id: notBaseTransaction.id,
        userId: notBaseTransaction.userId,
      },
      { transaction },
    );
  }

  await Transactions.updateTransactionById(
    {
      id: baseTransaction.id,
      userId: baseTransaction.userId,
      transferId: null,
      transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
    },
    { transaction },
  );
};

const isUpdatingTransferTx = (
  payload: UpdateTransactionParams,
  prevData: Transactions.default,
) => {
  // Previously was transfer, now NOT a transfer
  const nowNotTransfer = (
    payload.transferNature === undefined &&
    prevData.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer
  )

  // Previously was transfer, now also transfer
  const updatingTransfer = (
    payload.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer &&
    prevData.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer
  )

  return nowNotTransfer || updatingTransfer;
};

const isCreatingTransfer = (
  payload: UpdateTransactionParams,
  prevData: Transactions.default,
) => {
  return (
    payload.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer &&
    prevData.transferNature === TRANSACTION_TRANSFER_NATURE.not_transfer
  );
};

const isDiscardingTransfer = (
  payload: UpdateTransactionParams,
  prevData: Transactions.default,
) => {
  return (
    payload.transferNature !== TRANSACTION_TRANSFER_NATURE.common_transfer &&
    prevData.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer
  );
};

/**
 * Updates transaction and updates account balance.
 */
export const updateTransaction = async (payload: UpdateTransactionParams) => {
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
    const baseTransaction = await makeBasicBaseTxUpdation(
      payload,
      prevData,
      transaction,
    );

    let updatedTransactions: [Transactions.default, Transactions.default?] = [
      baseTransaction,
    ];

    const helperFunctionsArgs: HelperFunctionsArgs = [
      payload,
      prevData,
      baseTransaction,
      transaction,
    ];

    if (isUpdatingTransferTx(payload, prevData)) {
      // Handle the case when initially tx was "expense", became "transfer",
      // but now user wants to unmark it from transfer and make "income"
      if (
        payload.transactionType !== undefined &&
        payload.transactionType !== prevData.transactionType
      ) {
        await deleteOppositeTransaction(helperFunctionsArgs);
      }

      const { baseTx, oppositeTx } = await updateTransferTransaction(helperFunctionsArgs)

      updatedTransactions = [baseTx, oppositeTx];
    } else if (isCreatingTransfer(payload, prevData)) {
      if (payload.destinationTransactionId) {
        const { baseTx, oppositeTx } = await linkTransactions({
          userId: payload.userId,
          baseTxId: payload.id,
          destinationTransactionId: payload.destinationTransactionId,
        }, { transaction });

        updatedTransactions = [baseTx, oppositeTx];
      } else {
        const { baseTx, oppositeTx } = await createOppositeTransaction([
          // When updating existing tx we usually don't pass transactionType, so
          // it will be `undefined`, that's why we derive it from prevData
          {
            ...payload,
            transactionType:
              payload.transactionType ?? prevData.transactionType,
          },
          baseTransaction,
          transaction,
        ]);
        updatedTransactions = [baseTx, oppositeTx];
      }
    } else if (isDiscardingTransfer(payload, prevData)) {
      await deleteOppositeTransaction(helperFunctionsArgs);
    }

    await transaction.commit();

    return updatedTransactions;
  } catch (e) {
    logger.error(e);
    await transaction.rollback();
    throw e;
  }
};
