import { TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';

import { getTransactionById } from './get-by-id.service';
import { updateAccountBalance } from './helpers';

export const deleteTransaction = async ({
  id,
  authorId,
}: {
  id: number;
  authorId: number;
}): Promise<void> => {
  let transaction: Transaction = null;

  console.log('start deletion')

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      accountId,
      isTransfer,
      transferId,
      transactionType,
    } = await getTransactionById({ id, authorId }, { transaction });

    console.log('isTransfer', isTransfer)

    if (!isTransfer) {
      // It might be the case that accountId is not specified in the tx
      if (accountId !== null) {
        console.log('start updating account')
        await updateAccountBalance(
          {
            userId: authorId,
            accountId,
            // make new amount 0, so the balance won't depend on this tx anymore
            amount: 0,
            previousAmount: transactionType === TRANSACTION_TYPES.income
              ? previousAmount
              : previousAmount * -1,
          },
          { transaction },
        );
      }

      console.log('start deleting tx')

      await Transactions.deleteTransactionById({ id, authorId }, { transaction });
    } else if (isTransfer && transferId) {
      const transferTransactions = await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        authorId,
      });

      console.log('transferTransactions', transferTransactions)

      await Promise.all(
        // For the each transaction with the same "transferId" update amount
        // and then delete transaction itself.
        transferTransactions.map(tx => Promise.all([
          updateAccountBalance(
            {
              userId: tx.authorId,
              accountId: tx.accountId,
              // make new amount 0, so the balance won't depend on this tx anymore
              amount: 0,
              previousAmount: tx.transactionType === TRANSACTION_TYPES.income
                ? tx.amount
                : tx.amount * -1,
            },
            { transaction },
          ),
          Transactions.deleteTransactionById({
            id: tx.id,
            authorId: tx.authorId
          }, { transaction }),
        ]))
      )
    } else {
      logger.info('No "transferId" exists for the transfer transaction type.')
    }

    await transaction.commit();
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    await transaction.rollback();
    throw e
  }
};
