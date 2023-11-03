import { logger} from '@js/utils/logger';
import * as Transactions from '@models/Transactions.model';
import { v4 as uuidv4 } from 'uuid';
import { getTransactionById } from './get-by-id';
import { UpdateTransactionParams } from './types';

export const linkTransactions = async ( { payload, baseTransaction, transaction }: {payload: UpdateTransactionParams, baseTransaction, transaction }) => {
  try {
    const transferId = uuidv4();

    const oppositeTx = await getTransactionById(
      { id: payload.destinationTransactionId, userId: payload.userId },
      { transaction },
    );

    await Transactions.updateTransactionById({
      id: baseTransaction.id,
      userId: baseTransaction.userId,
      isTransfer: true,
      transferId,
    }, { transaction });

    await Transactions.updateTransactionById({
      id: oppositeTx.id,
      userId: baseTransaction.userId,
      isTransfer: true,
      transferId,
    }, { transaction });

    return {
      baseTx: baseTransaction,
      oppositeTx: oppositeTx
    };
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

