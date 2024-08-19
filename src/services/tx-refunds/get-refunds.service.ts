import type { WhereOptions } from 'sequelize';
import { connection } from '@models/index';
import { logger } from '@js/utils/logger';
import { GenericSequelizeModelAttributes } from '@common/types';
import * as RefundTransactions from '@models/RefundTransactions.model';
import * as Transactions from '@models/Transactions.model';
import { TRANSACTION_TYPES } from 'shared-types';

export interface FiltersStructure {
  userId: number;
  categoryId?: number;
  transactionType?: TRANSACTION_TYPES;
  accountId?: number;
}

export interface GetRefundTransactionsParams extends FiltersStructure {
  page?: number;
  limit?: number;
}

export async function getRefundTransactions(
  {
    userId,
    categoryId,
    transactionType,
    accountId,
    page = 1,
    limit = 2,
  }: GetRefundTransactionsParams,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<{
  rows: RefundTransactions.default[];
  meta: { total: number; page: number; limit: number };
}> {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const transactionWhereClause: WhereOptions<FiltersStructure> = { userId };

    if (categoryId) {
      transactionWhereClause.categoryId = categoryId;
    }

    if (transactionType) {
      transactionWhereClause.transactionType = transactionType;
    }

    if (accountId) {
      transactionWhereClause.accountId = accountId;
    }

    const { rows, count: total } = await RefundTransactions.default.findAndCountAll({
      include: [
        {
          model: Transactions.default,
          as: 'originalTransaction',
          where: transactionWhereClause,
        },
        {
          model: Transactions.default,
          as: 'refundTransaction',
          where: { userId },
        },
      ],
      limit,
      offset: (page - 1) * limit,
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return { rows, meta: { total, page, limit } };
  } catch (e) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    logger.error('Error retrieving refund transactions:', e);
    throw e;
  }
}
