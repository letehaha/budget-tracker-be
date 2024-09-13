import { logger } from '@js/utils/logger';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { NotFoundError } from '@js/errors';
import { withTransaction } from '../common';

interface GetRefundParams {
  userId: number;
  originalTxId: number;
  refundTxId: number;
}

export const getRefund = withTransaction(
  async ({
    userId,
    originalTxId,
    refundTxId,
  }: GetRefundParams): Promise<RefundTransactions.default> => {
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

      return refundLink;
    } catch (e) {
      logger.error('Error retrieving refund link:', e);
      throw e;
    }
  },
);
