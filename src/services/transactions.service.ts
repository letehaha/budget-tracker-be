import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES, ERROR_CODES } from 'shared-types'

import { Transaction } from 'sequelize/types';

import { connection } from '@models/index';
import { UnexpectedError } from '@js/errors'
import * as Transactions from '@models/Transactions.model';
import * as accountsService from '@services/accounts.service';

export const calculateNewBalance = (
  amount: number,
  previousAmount: number,
  currentBalance: number,
) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount)
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount)
  }

  return currentBalance
}

/**
 * Updates the balance of the account associated with the transaction
 */
export const updateAccountBalance = async (
  {
    accountId,
    userId,
    amount,
    // keep it 0 be default for the tx creation flow
    previousAmount = 0,
  }: {
    accountId: number;
    userId: number;
    amount: number;
    previousAmount?: number;
  },
  { transaction }: { transaction: Transaction },
): Promise<void> => {
  try {
    const { currentBalance } = await accountsService.getAccountById(
      { id: accountId, userId },
      { transaction },
    );

    await accountsService.updateAccount(
      {
        id: accountId,
        userId,
        currentBalance: calculateNewBalance(amount, previousAmount ?? 0, currentBalance),
      },
      { transaction },
    )
  } catch (e) {
    console.error(e);
    throw new UnexpectedError(
      ERROR_CODES.txServiceUpdateBalance,
      'Cannot update balance.'
    )
  }
};

export const getTransactionById = async (
  {
    id,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    id: number;
    userId: number;
    includeUser?: boolean;
    includeAccount?: boolean;
    includeCategory?: boolean;
    includeAll?: boolean;
    nestedInclude?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  try {
    const data = await Transactions.getTransactionById({
      id,
      userId,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    }, { transaction });

    return data;
  } catch (err) {
    throw new err;
  }
};

/**
 * Creates transaction and updates account balance.
 */
export const createTransaction = async ({
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  accountType,
  userId,
  fromAccountId,
  fromAccountType,
  toAccountId,
  toAccountType,
  currencyId,
}: {
  amount: number;
  note?: string;
  time: string;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  fromAccountId?: number;
  fromAccountType?: ACCOUNT_TYPES;
  toAccountId?: number;
  toAccountType?: ACCOUNT_TYPES;
  oppositeId?: number;
  currencyId: number;
  accountType: ACCOUNT_TYPES;
},) => {
  let transaction: Transaction = null;

  transaction = await connection.sequelize.transaction();

  try {
    const txParams = {
      amount,
      note,
      time,
      userId,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      accountType,
      fromAccountId,
      fromAccountType,
      toAccountId,
      toAccountType,
      currencyId,
    };

    if (transactionType !== TRANSACTION_TYPES.transfer) {
      const data = await Transactions.createTransaction(
        txParams,
        { transaction },
      );

      await updateAccountBalance({
        accountId: txParams.accountId,
        userId: txParams.userId,
        amount: txParams.amount,
      }, { transaction });

      await transaction.commit();

      return data;
    } else {
      let tx1 = await Transactions.createTransaction(
        txParams,
        { transaction },
      );

      await updateAccountBalance({
        accountId: txParams.accountId,
        userId: txParams.userId,
        amount: txParams.amount * -1,
      }, { transaction });

      const tx2Params = {
        ...txParams,
        amount: txParams.amount,
        accountId: toAccountId,
        accountType: toAccountType,
      };

      let tx2 = await Transactions.createTransaction(
        tx2Params,
        { transaction },
      );

      await updateAccountBalance({
        accountId: tx2Params.accountId,
        userId: tx2Params.userId,
        amount: tx2Params.amount,
      }, { transaction });

      // Set correct oppositeId to tx1
      tx1 = await Transactions.updateTransactionById(
        {
          id: tx1.id,
          userId: tx1.userId,
          oppositeId: tx2.id,
        },
        { transaction },
      );
      // Set correct oppositeId to tx2
      tx2 = await Transactions.updateTransactionById(
        {
          id: tx2.id,
          userId: tx2.userId,
          oppositeId: tx1.id,
        },
        { transaction },
      );

      await transaction.commit();

      return [tx1, tx2];
    }

  } catch (e) {
    await transaction.rollback();
    throw e;
  }
};

/**
 * Updates transaction and updates account balance.
 */
export const updateTransaction = async ({
  id,
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  userId,
}) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    if (transactionType !== TRANSACTION_TYPES.transfer) {
      // TODO: updateBalance when account is changed
      const { amount: previousAmount } = await Transactions.getTransactionById(
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
          transactionType,
          paymentType,
          accountId,
          categoryId,
        },
        { transaction },
      );

      await updateAccountBalance(
        {
          accountId,
          userId,
          amount,
          previousAmount,
        },
        { transaction },
      )

      await transaction.commit();

      return data
    } else {
      // TODO: updateBalance when account is changed
      const updateAmount = async ({
        id,
        userId,
        amount,
        note,
        time,
        transactionType,
        paymentType,
        accountId,
        categoryId,
      }) => {
        const { amount: previousAmount } = await Transactions.getTransactionById(
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
            transactionType,
            paymentType,
            accountId,
            categoryId,
          },
          { transaction },
        );

        await updateAccountBalance(
          {
            accountId,
            userId,
            amount,
            previousAmount,
          },
          { transaction },
        );

        return data;
      };

      const tx1 = await updateAmount({
        id,
        userId,
        amount,
        note,
        time,
        transactionType,
        paymentType,
        accountId,
        categoryId,
      });

      const { oppositeId } = await Transactions.getTransactionById(
        { id, userId },
        { transaction },
      );

      const { id: tx2Id, accountId: tx2AccountId } = await Transactions.getTransactionById(
        { id: oppositeId, userId },
        { transaction },
      );

      const tx2 = await updateAmount({
        id: tx2Id,
        userId,
        amount: amount * -1,
        note,
        time,
        transactionType,
        paymentType,
        accountId: tx2AccountId,
        categoryId,
      });

      await transaction.commit();

      return [tx1, tx2];
    }
  } catch (e) {
    console.error(e);
    await transaction.rollback();
    throw e;
  }
};

export const deleteTransaction = async ({
  id,
  userId,
}: {
  id: number;
  userId: number;
}): Promise<void> => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      accountId,
      oppositeId,
      transactionType,
    } = await getTransactionById({ id, userId }, { transaction });

    await updateAccountBalance(
      {
        userId,
        accountId,
        // make new amount 0, so the balance won't depend on this tx anymore
        amount: 0,
        previousAmount: transactionType === TRANSACTION_TYPES.transfer
          ? previousAmount * -1
          : previousAmount,
      },
      { transaction },
    );

    await Transactions.deleteTransactionById({ id, userId }, { transaction });

    if (transactionType === TRANSACTION_TYPES.transfer && oppositeId) {
      const {
        amount: previousAmount,
        accountId,
      } = await getTransactionById({ id: oppositeId, userId }, { transaction })

      await updateAccountBalance(
        {
          userId,
          accountId,
          // make new amount 0, so the balance won't depend on this tx anymore
          amount: 0,
          previousAmount,
        },
        { transaction },
      )

      await Transactions.deleteTransactionById({ id: oppositeId, userId }, { transaction });
    } else if (transactionType === TRANSACTION_TYPES.transfer && !oppositeId) {
      // TODO: add error logger that Transfer function does not have oppositeId for some reason
      console.log('NO OPPOSITE ID FOR TRANSFER TYPE')
    }

    await transaction.commit();
  } catch (e) {
    // TODO: add logger
    await transaction.rollback();
    throw e
  }
};
