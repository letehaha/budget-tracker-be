import { Op } from 'sequelize';
import {
  TransactionModel,
  TRANSACTION_TYPES,
  TRANSACTION_TRANSFER_NATURE,
} from 'shared-types';
import { removeUndefinedKeys } from '@js/helpers';
import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';

interface DateQuery {
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
}

const getWhereConditionForTime = ({ from, to }: DateQuery) => {
  const where: { time?: Record<symbol, Date[] | Date> } = {};

  if (from && to) {
    where.time = {
      [Op.between]: [new Date(from), new Date(to)],
    };
  } else if (from) {
    where.time = {
      [Op.gte]: new Date(from),
    };
  } else if (to) {
    where.time = {
      [Op.lte]: new Date(to),
    };
  }

  return where;
};

export type GetExpensesHistoryResponseSchema = Pick<
  TransactionModel,
  | 'accountId'
  | 'time'
  | 'amount'
  | 'refAmount'
  | 'currencyId'
  | 'currencyCode'
  | 'categoryId'
>;

/**
 * Fetches the expense history for a specified user within an optional date range and account.
 *
 * @param {Object} params - The parameters for fetching balances.
 * @param {number} params.userId - The ID of the user for whom balances are to be fetched.
 * @param {string} [params.from] - The start date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {string} [params.to] - The end date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {string} [params.accountId] - Load history for asked account.
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional Sequelize model attributes for the query.
 * @returns {Promise<BalanceModel[]>} - A promise that resolves to an array of expenses records.
 * @throws {Error} - Throws an error if the database query fails.
 *
 * @example
 * const balances = await getExpensesHistory({ userId: 1, from: '2023-01-01', to: '2023-12-31' });
 */
export const getExpensesHistory = async (
  {
    userId,
    from,
    to,
    accountId,
  }: {
    userId: number;
    accountId?: number;
    from?: string;
    to?: string;
  },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<GetExpensesHistoryResponseSchema[]> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const dataAttributes: (keyof Transactions.default)[] = [
      'accountId',
      'time',
      'amount',
      'refAmount',
      'currencyId',
      'currencyCode',
      'categoryId',
    ];

    const transactions = await Transactions.default.findAll({
      where: removeUndefinedKeys({
        accountId,
        userId,
        transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
        transactionType: TRANSACTION_TYPES.expense,
        ...getWhereConditionForTime({ from, to }),
      }),
      order: [['time', 'ASC']],
      raw: attributes.raw || true,
      attributes: dataAttributes,
      transaction,
    });

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return transactions;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
