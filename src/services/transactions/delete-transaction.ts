import { Transaction } from 'sequelize/types';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';

import { getTransactionById } from './get-by-id';
import { ACCOUNT_TYPES } from 'shared-types';
import { ValidationError } from '@js/errors';

export const deleteTransaction = async ({
  id,
  userId,
}: {
  id: number;
  userId: number;
}): Promise<void> => {
  const transaction: Transaction = await connection.sequelize.transaction();

  try {
    const { accountType, isTransfer, transferId } = await getTransactionById({ id, userId }, { transaction });

    if (accountType !== ACCOUNT_TYPES.system) {
      throw new ValidationError({ message: "It's not possible to manually delete external transactions" });
    }

    if (!isTransfer) {
      await Transactions.deleteTransactionById({ id, userId }, { transaction });
    } else if (isTransfer && transferId) {
      const transferTransactions = await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        userId,
      });

      await Promise.all(
        // For the each transaction with the same "transferId" delete transaction
        transferTransactions.map(tx => Promise.all([
          Transactions.deleteTransactionById({
            id: tx.id,
            userId: tx.userId,
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
