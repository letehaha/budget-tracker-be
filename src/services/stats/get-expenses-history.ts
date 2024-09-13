import { TransactionModel, TRANSACTION_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { removeUndefinedKeys } from '@js/helpers';

import * as Transactions from '@models/Transactions.model';
import { getWhereConditionForTime } from './utils';
import { withTransaction } from '../common';

export type GetExpensesHistoryResponseSchema = Pick<
  TransactionModel,
  | 'id'
  | 'accountId'
  | 'time'
  | 'amount'
  | 'refAmount'
  | 'currencyId'
  | 'currencyCode'
  | 'categoryId'
  | 'refundLinked'
  | 'transactionType'
>;

/**
 * Fetches the expense history for a specified user within an optional date range and account.
 *
 * @param {Object} params - The parameters for fetching balances.
 * @param {number} params.userId - The ID of the user for whom balances are to be fetched.
 * @param {string} [params.from] - The start date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {string} [params.to] - The end date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {string} [params.accountId] - Load history for asked account.
 * @returns {Promise<BalanceModel[]>} - A promise that resolves to an array of expenses records.
 * @throws {Error} - Throws an error if the database query fails.
 *
 * @example
 * const balances = await getExpensesHistory({ userId: 1, from: '2023-01-01', to: '2023-12-31' });
 */
export const getExpensesHistory = withTransaction(
  async ({
    userId,
    from,
    to,
    accountId,
  }: {
    userId: number;
    accountId?: number;
    from?: string;
    to?: string;
  }): Promise<GetExpensesHistoryResponseSchema[]> => {
    const dataAttributes: (keyof Transactions.default)[] = [
      'id',
      'accountId',
      'time',
      'amount',
      'refAmount',
      'currencyId',
      'currencyCode',
      'categoryId',
      'refundLinked',
      'transactionType',
    ];

    const transactions = await Transactions.default.findAll({
      where: removeUndefinedKeys({
        accountId,
        userId,
        transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
        transactionType: TRANSACTION_TYPES.expense,
        ...getWhereConditionForTime({ from, to, columnName: 'time' }),
      }),
      order: [['time', 'ASC']],
      attributes: dataAttributes,
    });

    return transactions;
  },
);
