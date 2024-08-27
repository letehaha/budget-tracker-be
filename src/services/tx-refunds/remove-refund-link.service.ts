import { Op } from 'sequelize';
import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { NotFoundError } from '@js/errors';

interface RemoveRefundLinkParams {
  userId: number;
  originalTxId: number | null;
  refundTxId: number;
}

export async function removeRefundLink(
  { userId, originalTxId, refundTxId }: RemoveRefundLinkParams,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<void> {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    // Fetch the refund link
    const refundLink = await RefundTransactions.default.findOne({
      where: {
        originalTxId,
        refundTxId,
        userId,
      },
      transaction,
    });

    if (!refundLink) {
      throw new NotFoundError({
        message: 'Refund link not found',
      });
    }

    // Remove the refund link
    await refundLink.destroy({ transaction });

    await Transactions.updateTransactions(
      { refundLinked: false },
      { userId, id: { [Op.in]: [originalTxId, refundTxId].filter(Boolean) } },
      { transaction, individualHooks: false },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    logger.info(
      `Refund link between transactions ${originalTxId} and ${refundTxId} removed successfully`,
    );
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error('Error removing refund link:', e);
    }
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw e;
  }
}
