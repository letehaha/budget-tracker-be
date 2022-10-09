import { Transaction } from 'sequelize/types';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';

import { getTransactionById } from './get-by-id';

export const deleteTransaction = async ({
  id,
  authorId,
}: {
  id: number;
  authorId: number;
}): Promise<void> => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const { isTransfer, transferId } = await getTransactionById({ id, authorId }, { transaction });

    if (!isTransfer) {
      await Transactions.deleteTransactionById({ id, authorId }, { transaction });
    } else if (isTransfer && transferId) {
      const transferTransactions = await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        authorId,
      });

      await Promise.all(
        // For the each transaction with the same "transferId" delete transaction
        transferTransactions.map(tx => Promise.all([
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
