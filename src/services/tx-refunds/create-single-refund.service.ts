import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { NotFoundError, ValidationError } from '@js/errors';
import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';

interface CreateSingleRefundParams {
  userId: number;
  originalTxId: number;
  refundTxId: number;
}

/**
 * Creates a single refund transaction for an original transaction.
 * There's following rules when creating is disallowed:
 * 1. When base_tx or refund_tx cannot be found.
 * 2. When base_tx and refund_tx have the same transactionType. They should always be opposite
 * 3. Refund `refAmount` is GREATER than base tx `refAmount`. `amount` can be greater or less, due to
 *    different currencies.
 * 4. Sum of multiple refunds is greater than the `refAmount` of the base tx. Basically the same as
 *    3rd point.
 * 5. Refund over `transfer` transaction. Might be supported in the future, but not now.
 * 6. Refund over existing refund.
 *
 * @async
 * @export
 * @param {Object} params
 * @param {number} params.userId - The ID of the user creating the refund.
 * @param {number} params.originalTxId - The ID of the original transaction.
 * @param {number} params.refundTxId - The ID of the refund transaction.
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional attributes, such as a transaction object.
 * @returns {Promise<RefundTransactions>} The created refund transaction.
 * @throws {Error} Throws an error if validation fails or if the operation fails.
 */
export async function createSingleRefund(
  { userId, originalTxId, refundTxId }: CreateSingleRefundParams,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<RefundTransactions.default> {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    // Fetch original and refund transactions
    const [originalTx, refundTx] = await Promise.all([
      Transactions.getTransactionById({ userId, id: originalTxId }, { transaction }),
      Transactions.getTransactionById({ userId, id: refundTxId }, { transaction }),
    ]);

    if (!originalTx) {
      throw new NotFoundError({
        message: 'Original (non-refund) transaction not found',
      });
    }
    if (!refundTx) {
      throw new NotFoundError({
        message: 'Refund transaction not found',
      });
    }

    if (originalTx.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer) {
      throw new ValidationError({
        message: 'Original (non-refund) transaction cannot be transfer one.',
      });
    }
    if (refundTx.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer) {
      throw new ValidationError({
        message: 'Refund transaction cannot be a transfer one.',
      });
    }

    // Check if transaction types are opposite
    if (originalTx.transactionType === refundTx.transactionType) {
      throw new ValidationError({
        message: 'Refund transaction must have the opposite transaction type to the original',
      });
    }

    // Check if refund amount is not greater than original amount. Check exactly for
    // refAmount, since transactions might have different currencies
    if (Math.abs(refundTx.refAmount) > Math.abs(originalTx.refAmount)) {
      throw new ValidationError({
        message: 'Refund amount cannot be greater than the original transaction amount',
      });
    }

    // Prevent "refund" over "refund"
    const isOriginalTxRefund = await RefundTransactions.default.findOne({
      where: { refund_tx_id: originalTxId },
      transaction,
    });

    if (isOriginalTxRefund) {
      throw new ValidationError({
        message: 'Cannot refund a "refund" transaction',
      });
    }

    // Fetch all existing refunds for the original transaction
    const existingRefunds = await RefundTransactions.default.findAll({
      where: { original_tx_id: originalTxId },
      include: [{ model: Transactions.default, as: 'refundTransaction' }],
      transaction,
    });

    // Calculate the total refunded amount
    const totalRefundedAmount = existingRefunds.reduce((sum, refund) => {
      return sum + Math.abs(refund.refundTransaction.refAmount);
    }, 0);

    // Check if the new refund would exceed the original transaction amount
    if (totalRefundedAmount + Math.abs(refundTx.refAmount) > Math.abs(originalTx.refAmount)) {
      throw new ValidationError({
        message: 'Total refund amount cannot be greater than the original transaction amount',
      });
    }

    // Create the refund transaction link
    const refundTransaction = await RefundTransactions.createRefundTransaction(
      { original_tx_id: originalTxId, refund_tx_id: refundTxId },
      { transaction },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return refundTransaction;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw e;
  }
}
