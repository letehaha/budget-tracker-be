import { Op } from 'sequelize';
import { ACCOUNT_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';

import * as Transactions from '@models/Transactions.model';
import RefundTransactions from '@models/RefundTransactions.model';

import { logger } from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { withTransaction } from '@services/common';

import { updateBalanceOnTxDelete } from '@services/account-balances/update-balance-on-tx-delete';

export const deleteTransaction = withTransaction(async (params: Params): Promise<void> => {
  const { id, userId, skipExtraChecks } = params;

  try {
    const transaction = await Transactions.default.findOne({
      where: { id, userId },
      raw: true,
    });

    if (!transaction) return undefined;

    const { accountType, transferNature, transferId, refundLinked } = transaction;

    if (accountType !== ACCOUNT_TYPES.system) {
      throw new ValidationError({
        message: "It's not allowed to manually delete external transactions",
      });
    }

    const updateBalancesTable: Transactions.default[] = [];

    if (skipExtraChecks) {
      await Transactions.deleteTransactionById({ id, userId });
      updateBalancesTable.push(transaction);
    } else {
      if (refundLinked) {
        await unlinkRefundTransaction(id);
      }

      if (transferNature === TRANSACTION_TRANSFER_NATURE.not_transfer) {
        await Transactions.deleteTransactionById({ id, userId });
        updateBalancesTable.push(transaction);
      } else if (transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer && transferId) {
        const transferTransactions = await Transactions.getTransactionsByArrayOfField({
          fieldValues: [transferId],
          fieldName: 'transferId',
          userId,
        });

        await Promise.all(
          // For the each transaction with the same "transferId" delete transaction
          transferTransactions.map((tx) =>
            Transactions.deleteTransactionById({
              id: tx.id,
              userId: tx.userId,
            }),
          ),
        );
        updateBalancesTable.push(...transferTransactions);
      } else {
        logger.info('No "transferId" exists for the transfer transaction type.');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (!updateBalancesTable.length) {
        throw new Error("There's no transactions to update in the balances table");
      }
    }

    await Promise.all(
      updateBalancesTable.map((tx) =>
        updateBalanceOnTxDelete({
          accountId: tx.accountId,
          transactionType: tx.transactionType,
          prevRefAmount: tx.refAmount,
          time: new Date(tx.time).toISOString(),
        }),
      ),
    );
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    throw e;
  }
});

interface Params {
  id: number;
  userId: number;
  // In certain cases we only want to delete transaction and call all required balance adjustments
  // without unlinking refund transactions or other extra checks
  skipExtraChecks?: boolean;
}

const unlinkRefundTransaction = withTransaction(async (id: number) => {
  const refundTx = await RefundTransactions.findOne({
    where: {
      [Op.or]: [{ originalTxId: id }, { refundTxId: id }],
    },
  });

  if (!refundTx) return undefined;

  const transactionIdsToUpdate = [refundTx.refundTxId, refundTx.originalTxId].filter(
    (i) => Boolean(i) && i !== id,
  );

  if (transactionIdsToUpdate.length) {
    await Transactions.default.update(
      { refundLinked: false },
      {
        where: {
          id: {
            [Op.in]: transactionIdsToUpdate,
          },
        },
      },
    );
  }
});
