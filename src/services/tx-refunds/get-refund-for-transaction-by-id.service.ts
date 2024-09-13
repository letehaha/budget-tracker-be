import { Op } from 'sequelize';
import { logger } from '@js/utils/logger';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { withTransaction } from '../common';

interface GetRefundParams {
  userId: number;
  transactionId: number;
}

export const getRefundsForTransactionById = withTransaction(
  async ({ userId, transactionId }: GetRefundParams): Promise<RefundTransactions.default[]> => {
    try {
      const refunds = await RefundTransactions.default.findAll({
        where: {
          [Op.or]: [
            {
              originalTxId: transactionId,
            },
            {
              refundTxId: transactionId,
            },
          ],
        },
        include: [
          {
            model: Transactions.default,
            as: 'originalTransaction',
            where: { userId },
          },
          {
            model: Transactions.default,
            as: 'refundTransaction',
            where: { userId },
          },
        ],
      });

      return refunds;
    } catch (e) {
      logger.error('Error retrieving refunds for transaction:', e);
      throw e;
    }
  },
);
