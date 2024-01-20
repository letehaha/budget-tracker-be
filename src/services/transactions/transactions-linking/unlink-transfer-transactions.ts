import { TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { Op, Transaction } from 'sequelize';
import { connection } from '@models/index';
import { GenericSequelizeModelAttributes } from '@common/types';
import { logger } from '@js/utils/logger';
import * as Transactions from '@models/Transactions.model';

export const unlinkTransferTransactions = async (
  payload: { userId: number; transferIds: string[] },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<Transactions.default[]> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction: Transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const transactions = await Transactions.getTransactionsByArrayOfField(
      {
        userId: payload.userId,
        fieldName: 'transferId',
        fieldValues: payload.transferIds,
      },
      { transaction },
    );

    const txIds = transactions.map((t) => t.id);
    await Transactions.default.update(
      {
        transferId: null,
        transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
      },
      {
        where: {
          userId: payload.userId,
          id: { [Op.in]: txIds },
        },
        transaction,
      },
    );

    const updatedTxs = await Transactions.getTransactionsByArrayOfField(
      {
        userId: payload.userId,
        fieldName: 'id',
        fieldValues: txIds,
      },
      { transaction },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return updatedTxs;
  } catch (err) {
    logger.error(err);
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
