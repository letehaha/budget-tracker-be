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

export const deleteTransaction = async ({
  id,
  userId,
}: {
  id: number;
  userId: number;
}): Promise<void> => {
  // let transaction: Transaction = null;

  // try {
  //   transaction = await connection.sequelize.transaction();

  //   const {
  //     amount: previousAmount,
  //     accountId,
  //     oppositeId,
  //     transactionType,
  //   } = await getTransactionById({ id, userId }, { transaction });

  //   // It might be the case that accountId is not specified in the tx
  //   if (accountId !== null) {
  //     await updateAccountBalance(
  //       {
  //         userId,
  //         accountId,
  //         // make new amount 0, so the balance won't depend on this tx anymore
  //         amount: 0,
  //         previousAmount: transactionType === TRANSACTION_TYPES.transfer
  //           ? previousAmount * -1
  //           : previousAmount,
  //       },
  //       { transaction },
  //     );
  //   }

  //   await Transactions.deleteTransactionById({ id, userId }, { transaction });

  //   if (transactionType === TRANSACTION_TYPES.transfer && oppositeId) {
  //     const {
  //       amount: previousAmount,
  //       accountId,
  //     } = await getTransactionById({ id: oppositeId, userId }, { transaction })

  //     await updateAccountBalance(
  //       {
  //         userId,
  //         accountId,
  //         // make new amount 0, so the balance won't depend on this tx anymore
  //         amount: 0,
  //         previousAmount,
  //       },
  //       { transaction },
  //     )

  //     await Transactions.deleteTransactionById({ id: oppositeId, userId }, { transaction });
  //   } else if (transactionType === TRANSACTION_TYPES.transfer && !oppositeId) {
  //     logger.info('NO OPPOSITE ID FOR TRANSFER TYPE')
  //   }

  //   await transaction.commit();
  // } catch (e) {
  //   if (process.env.NODE_ENV !== 'test') {
  //     logger.error(e);
  //   }
  //   await transaction.rollback();
  //   throw e
  // }
};

export * from './transactions';
