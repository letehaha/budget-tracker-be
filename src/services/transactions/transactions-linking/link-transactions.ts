import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as Transactions from '@models/Transactions.model';
import { v4 as uuidv4 } from 'uuid';
import { connection } from '@models/index';
import { ValidationError } from '@js/errors';
import { Op, Transaction } from 'sequelize';

const validateTransactionLinking = ({
  base,
  opposite,
  ignoreBaseTxTypeValidation,
}: {
  base: Transactions.default;
  opposite: Transactions.default;
  ignoreBaseTxTypeValidation?: boolean;
}) => {
  if (base.id === opposite.id) {
    throw new ValidationError({
      message: 'Trying to link the transaction to itself.',
    });
  }
  if (opposite.transactionType === base.transactionType) {
    throw new ValidationError({
      message: 'Trying to link with the transaction that has the same "transactionType".',
    });
  }
  if (opposite.accountId === base.accountId) {
    throw new ValidationError({
      message:
        "Trying to link with the transaction within the same account. It's allowed to link only between different accounts",
    });
  }
  if (
    opposite.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer ||
    (!ignoreBaseTxTypeValidation &&
      base.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer)
  ) {
    // TODO: disabled when multiple links are available
    throw new ValidationError({
      message: 'Trying to link transaction that is already a transfer.',
    });
  }
};

export const linkTransactions = async (
  {
    userId,
    ids,
    ignoreBaseTxTypeValidation,
  }: {
    userId: number;
    ids: [baseTxId: number, oppositeTxId: number][];
    ignoreBaseTxTypeValidation?: boolean;
  },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<[baseTx: Transactions.default, oppositeTx: Transactions.default][]> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction: Transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const result: [baseTx: Transactions.default, oppositeTx: Transactions.default][] = [];

    for (const [baseTxId, oppositeTxId] of ids) {
      let transactions = await Transactions.getTransactionsByArrayOfField(
        {
          userId,
          fieldName: 'id',
          fieldValues: [baseTxId, oppositeTxId],
        },
        { transaction },
      );

      if (transactions.length !== 2) {
        throw new ValidationError({
          message: 'Unexpected error. Cannot link asked transactions.',
        });
      }

      validateTransactionLinking({
        base: transactions.find((tx) => tx.id === baseTxId),
        opposite: transactions.find((tx) => tx.id === oppositeTxId),
        ignoreBaseTxTypeValidation,
      });

      await Transactions.default.update(
        {
          transferId: uuidv4(),
          transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
        },
        {
          where: {
            userId,
            id: { [Op.in]: [baseTxId, oppositeTxId] },
          },
          transaction,
        },
      );

      transactions = await Transactions.getTransactionsByArrayOfField(
        {
          userId,
          fieldName: 'id',
          fieldValues: [baseTxId, oppositeTxId],
        },
        { transaction },
      );

      result.push([
        transactions.find((tx) => tx.id === baseTxId),
        transactions.find((tx) => tx.id === oppositeTxId),
      ]);
    }

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    logger.error(err);
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
