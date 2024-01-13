import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as Transactions from '@models/Transactions.model';
import { v4 as uuidv4 } from 'uuid';
import { getTransactionById } from './get-by-id';
import { ValidationError } from '@js/errors';

const validateTransactionLinking = (
  baseTx: Transactions.default,
  oppositeTx: Transactions.default,
) => {
  if (oppositeTx.transactionType === baseTx.transactionType) {
    throw new ValidationError({
      message:
        'Trying to link with the transaction that has the same "transactionType".',
    });
  }
  if (oppositeTx.accountId === baseTx.accountId) {
    throw new ValidationError({
      message:
        "Trying to link with the transaction within the same account. It's allowed to link only between different accounts",
    });
  }
};

export const linkTransactions = async (
  {
    userId,
    baseTx,
    destinationTransactionId,
  }: {
    destinationTransactionId: number;
    userId: number;
    baseTx: Transactions.default;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  try {
    const transferId = uuidv4();

    const sharedPayload = {
      userId,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
      transferId,
    };

    const oppositeTx = await getTransactionById(
      { userId, id: destinationTransactionId },
      { transaction: attributes.transaction },
    );

    validateTransactionLinking(baseTx, oppositeTx);

    const [base, opposite] = await Promise.all([
      Transactions.updateTransactionById(
        { id: baseTx.id, ...sharedPayload },
        { transaction: attributes.transaction },
      ),
      Transactions.updateTransactionById(
        { id: destinationTransactionId, ...sharedPayload },
        { transaction: attributes.transaction },
      ),
    ]);

    return { baseTx: base, oppositeTx: opposite };
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
