import { TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';

import { logger} from '@js/utils/logger';
import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';

import { updateAccountBalance } from './transactions';

export const getTransactionById = async (
  {
    id,
    authorId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    id: number;
    authorId: number;
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
      authorId,
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
  // let transaction: Transaction = null;

  // try {
  //   transaction = await connection.sequelize.transaction();

  //   if (transactionType !== TRANSACTION_TYPES.transfer) {
  //     const {
  //       amount: previousAmount,
  //       accountId: previousAccountId,
  //     } = await getTransactionById(
  //       { id, userId },
  //       { transaction },
  //     );

  //     const data = await Transactions.updateTransactionById(
  //       {
  //         id,
  //         amount,
  //         note,
  //         time,
  //         userId,
  //         transactionType,
  //         paymentType,
  //         accountId,
  //         categoryId,
  //       },
  //       { transaction },
  //     );

  //     // If accountId was changed to a new one
  //     if (accountId && accountId !== previousAccountId) {
  //       // Make previous account's balance if like there was no transaction before
  //       await updateAccountBalance(
  //         {
  //           accountId: previousAccountId,
  //           userId,
  //           amount: 0,
  //           previousAmount,
  //         },
  //         { transaction },
  //       );

  //       // Update balance for the new account
  //       await updateAccountBalance(
  //         {
  //           accountId,
  //           userId,
  //           amount,
  //           previousAmount: 0,
  //         },
  //         { transaction },
  //       );
  //     } else {
  //       // Update balance for the new account
  //       await updateAccountBalance(
  //         {
  //           accountId,
  //           userId,
  //           amount,
  //           previousAmount,
  //         },
  //         { transaction },
  //       );
  //     }

  //     await transaction.commit();

  //     return data
  //   } else {
  //     // TODO: updateBalance when account is changed
  //     const updateAmount = async ({
  //       id,
  //       userId,
  //       amount,
  //       note,
  //       time,
  //       transactionType,
  //       paymentType,
  //       accountId,
  //       categoryId,
  //     }) => {
  //       const { amount: previousAmount, toAccountId } = await getTransactionById(
  //         { id, userId },
  //         { transaction },
  //       );

  //       const data = await Transactions.updateTransactionById(
  //         {
  //           id,
  //           amount,
  //           note,
  //           time,
  //           userId,
  //           transactionType,
  //           paymentType,
  //           accountId,
  //           categoryId,
  //         },
  //         { transaction },
  //       );

  //       // For "fromAccount" make amount negative
  //       // For "toAccount" make amount positive
  //       await updateAccountBalance(
  //         {
  //           accountId,
  //           userId,
  //           amount: accountId === toAccountId ? amount : amount * -1,
  //           previousAmount: accountId === toAccountId ? previousAmount : previousAmount * -1,
  //         },
  //         { transaction },
  //       );

  //       return data;
  //     };

  //     const tx1 = await updateAmount({
  //       id,
  //       userId,
  //       amount,
  //       note,
  //       time,
  //       transactionType,
  //       paymentType,
  //       accountId,
  //       categoryId,
  //     });

  //     const { oppositeId } = await getTransactionById(
  //       { id, userId },
  //       { transaction },
  //     );

  //     const { id: tx2Id, accountId: tx2AccountId } = await getTransactionById(
  //       { id: oppositeId, userId },
  //       { transaction },
  //     );

  //     const tx2 = await updateAmount({
  //       id: tx2Id,
  //       userId,
  //       amount,
  //       note,
  //       time,
  //       transactionType,
  //       paymentType,
  //       accountId: tx2AccountId,
  //       categoryId,
  //     });

  //     await transaction.commit();

  //     return [tx1, tx2];
  //   }
  // } catch (e) {
  //   if (process.env.NODE_ENV !== 'test') {
  //     logger.error(e);
  //   }
  //   await transaction.rollback();
  //   throw e;
  // }
};

export * from './transactions';
