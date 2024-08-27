import { Op } from 'sequelize';
import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';

interface GetRefundParams {
  userId: number;
  transactionId: number;
}

export async function getRefundsForTransactionById(
  { userId, transactionId }: GetRefundParams,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<RefundTransactions.default[]> {
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

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
      transaction,
    });

    if (!attributes.transaction) {
      await transaction.commit();
    }

    return refunds;
  } catch (e) {
    if (!attributes.transaction) {
      await transaction.rollback();
    }
    logger.error('Error retrieving refunds for transaction:', e);
    throw e;
  }
}
