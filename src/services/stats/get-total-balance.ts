import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import { getBalanceHistory } from './get-balance-history';

/**
 * Retrieves the total balance for a user on a specified date.
 *
 * If a transaction is not passed in the attributes, the method will create its
 * own transaction and commit or rollback based on the outcome of the operations.
 *
 * @param {Object} params - The parameters for fetching the total balance.
 * @param {number} params.userId - The ID of the user for whom the total balance is to be fetched.
 * @param {string} params.date - The date in 'yyyy-mm-dd' format for which the total balance is to be calculated.
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional Sequelize model attributes for the query.
 * @returns {Promise<number>} - Total balance for asked date.
 * @throws {Error} - Throws an error if the database query fails or if there's an issue with the transaction.
 *
 * @example
 * const total = await getTotalBalance({ userId: 1, date: '2023-01-01' });
 */
export const getTotalBalance = async (
  { userId, date }: { userId: number; date: string },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<number> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const balancesForDate = await getBalanceHistory(
      { userId, from: date, to: date },
      {
        transaction,
        raw: attributes.raw ?? true,
      },
    );

    const totalBalance = balancesForDate.reduce((acc, value) => (acc += value.amount), 0);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return totalBalance;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
