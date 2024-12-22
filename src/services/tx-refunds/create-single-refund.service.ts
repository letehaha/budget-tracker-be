import { Op } from 'sequelize';
import { logger } from '@js/utils/logger';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { NotFoundError, ValidationError } from '@js/errors';
import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { withTransaction } from '../common';

interface CreateSingleRefundParams {
  userId: number;
  originalTxId: number | null;
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
 * @returns {Promise<RefundTransactions>} The created refund transaction.
 * @throws {Error} Throws an error if validation fails or if the operation fails.
 */
export const createSingleRefund = withTransaction(
  async ({ userId, originalTxId, refundTxId }: CreateSingleRefundParams): Promise<RefundTransactions.default> => {
    try {
      // Fetch original and refund transactions
      const [originalTx, refundTx] = await Promise.all([
        Transactions.getTransactionById({ userId, id: originalTxId! }),
        Transactions.getTransactionById({ userId, id: refundTxId }),
      ]);

      if (originalTxId && !originalTx) {
        throw new NotFoundError({
          message: 'Original transaction not found',
        });
      }

      if (!refundTx) {
        throw new NotFoundError({
          message: 'Refund transaction not found',
        });
      }

      if (originalTx) {
        if (originalTx.id === refundTx.id) {
          throw new ValidationError({
            message: 'Attempt to link a single transaction to itself.',
          });
        }

        if (originalTx.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer) {
          throw new ValidationError({
            message: 'Original (non-refund) transaction cannot be transfer one.',
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
      }

      if (refundTx.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer) {
        throw new ValidationError({
          message: 'Refund transaction cannot be a transfer one.',
        });
      }

      if (originalTxId) {
        // Prevent "refund" over "refund"
        const isOriginalTxRefund = await RefundTransactions.default.findOne({
          where: { refundTxId: originalTxId, userId },
        });

        if (isOriginalTxRefund) {
          throw new ValidationError({
            message: 'Cannot refund a "refund" transaction',
          });
        }
      }

      const existingRefund = await RefundTransactions.default.findOne({
        where: { refundTxId: refundTxId, userId },
      });

      if (existingRefund) {
        throw new ValidationError({
          message: '"refundTxId" already marked as a refund.',
        });
      }

      if (originalTxId && originalTx) {
        // Fetch all existing refunds for the original transaction
        const existingRefunds = await RefundTransactions.default.findAll({
          where: { originalTxId, userId },
          include: [{ model: Transactions.default, as: 'refundTransaction' }],
        });

        // Calculate the total refunded amount
        const totalRefundedAmount = existingRefunds.reduce((sum, refund) => {
          return sum + Math.abs(refund.refundTransaction.refAmount);
        }, Math.abs(refundTx.refAmount));

        // Check if the new refund would exceed the original transaction amount
        if (totalRefundedAmount > Math.abs(originalTx.refAmount)) {
          throw new ValidationError({
            message: 'Total refund amount cannot be greater than the original transaction amount',
          });
        }
      }

      // Create the refund transaction link
      const refundTransaction = await RefundTransactions.createRefundTransaction({
        originalTxId,
        refundTxId,
        userId,
      });

      await Transactions.updateTransactions(
        { refundLinked: true },
        { userId, id: { [Op.in]: [originalTxId, refundTxId].filter(Boolean) } },
        { individualHooks: false },
      );

      return refundTransaction;
    } catch (e) {
      if (process.env.NODE_ENV !== 'test') {
        logger.error(e);
      }
      throw e;
    }
  },
);
