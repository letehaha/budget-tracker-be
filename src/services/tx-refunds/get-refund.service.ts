import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { NotFoundError } from '@js/errors';

interface GetRefundParams {
  userId: number;
  originalTxId: number;
  refundTxId: number;
}

export async function getRefund(
  { userId, originalTxId, refundTxId }: GetRefundParams,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<RefundTransactions.default> {
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const refundLink = await RefundTransactions.default.findOne({
      where: {
        originalTxId,
        refundTxId,
        userId,
      },
      include: [
        {
          model: Transactions.default,
          as: 'originalTransaction',
        },
        {
          model: Transactions.default,
          as: 'refundTransaction',
        },
      ],
      transaction,
    });

    if (!refundLink) {
      throw new NotFoundError({
        message: 'Refund link not found',
      });
    }

    const haveNoAccess =
      refundLink.originalTransaction.userId !== userId ||
      refundLink.refundTransaction.userId !== userId;

    if (haveNoAccess) {
      logger.warn('User tried to access transactions that that dont belong to him.');
      throw new NotFoundError({
        message: 'Refund link not found',
      });
    }

    if (!attributes.transaction) {
      await transaction.commit();
    }

    return refundLink;
  } catch (e) {
    if (!attributes.transaction) {
      await transaction.rollback();
    }
    logger.error('Error retrieving refund link:', e);
    throw e;
  }
}
