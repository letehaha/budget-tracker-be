import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as Transactions from '@models/Transactions.model';
import { v4 as uuidv4 } from 'uuid';

export const linkTransactions = async (
  {
    userId,
    baseTxId,
    destinationTransactionId,
  }: {
    destinationTransactionId: number;
    userId: number;
    baseTxId: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  try {
    const transferId = uuidv4();

    const sharedPayload = {
      userId,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
      transferId,
    }

    const [baseTx, oppositeTx] = await Promise.all([
      Transactions.updateTransactionById(
        { id: baseTxId, ...sharedPayload },
        { transaction: attributes.transaction },
      ),
      Transactions.updateTransactionById(
        { id: destinationTransactionId, ...sharedPayload },
        { transaction: attributes.transaction },
      ),
    ]);

    return { baseTx, oppositeTx };
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

