import { Op } from 'sequelize';
import { ACCOUNT_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';

import * as Transactions from '@models/Transactions.model';
import RefundTransactions from '@models/RefundTransactions.model';

import { logger } from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { withTransaction } from '@services/common';

import { updateBalanceOnTxDelete } from '@services/account-balances/update-balance-on-tx-delete';
import { updateAccountBalanceForChangedTx } from '../accounts';

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

    if (skipExtraChecks) {
      await Transactions.deleteTransactionById({ id, userId });
      await updateAccountBalanceForChangedTx({
        userId,
        accountId: transaction.accountId,
        prevAmount: transaction.amount,
        prevRefAmount: transaction.refAmount,
        transactionType: transaction.transactionType,
      });
      await updateBalanceOnTxDelete({
        accountId: transaction.accountId,
        transactionType: transaction.transactionType,
        prevRefAmount: transaction.refAmount,
        time: new Date(transaction.time).toISOString(),
      });
    } else {
      if (refundLinked) {
        await unlinkRefundTransaction(id);
      }

      if (transferNature === TRANSACTION_TRANSFER_NATURE.not_transfer) {
        await Transactions.deleteTransactionById({ id, userId });
        await updateAccountBalanceForChangedTx({
          userId,
          accountId: transaction.accountId,
          prevAmount: transaction.amount,
          prevRefAmount: transaction.refAmount,
          transactionType: transaction.transactionType,
        });
        await updateBalanceOnTxDelete({
          accountId: transaction.accountId,
          transactionType: transaction.transactionType,
          prevRefAmount: transaction.refAmount,
          time: new Date(transaction.time).toISOString(),
        });
      } else if (transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer && transferId) {
        const transferTransactions = await Transactions.getTransactionsByArrayOfField({
          fieldValues: [transferId],
          fieldName: 'transferId',
          userId,
        });

        await Promise.all(
          // For the each transaction with the same "transferId" delete transaction
          transferTransactions
            .map((tx) => [
              Transactions.deleteTransactionById({
                id: tx.id,
                userId: tx.userId,
              }),
              updateAccountBalanceForChangedTx({
                userId: tx.userId,
                accountId: tx.accountId,
                prevAmount: tx.amount,
                prevRefAmount: tx.refAmount,
                transactionType: tx.transactionType,
              }),
              updateBalanceOnTxDelete({
                accountId: tx.accountId,
                transactionType: tx.transactionType,
                prevRefAmount: tx.refAmount,
                time: new Date(tx.time).toISOString(),
              }),
            ])
            .flat(),
        );
      } else {
        logger.info('No "transferId" exists for the transfer transaction type.');
      }
    }
  } catch (e) {
    logger.error(e);
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
