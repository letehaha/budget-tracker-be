import { Op } from 'sequelize';
import { BalanceModel } from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import * as Balances from '@models/Balances.model';
import * as Accounts from '@models/Accounts.model';

interface DateQuery {
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
}

const getWhereConditionForTime = ({ from, to }: DateQuery) => {
  const where: { date?: Record<symbol, Date[] | Date> } = {}

  if (from && to) {
    where.date = {
      [Op.between]: [new Date(from), new Date(to)],
    };
  } else if (from) {
    where.date = {
      [Op.gte]: new Date(from),
    };
  } else if (to) {
    where.date = {
      [Op.lte]: new Date(to),
    };
  }

  return where;
};

/**
 * Retrieves the balances for the requested account for a user within a specified date range.
 * If no balance record is found for an account between the "from" and "to" dates,
 * and also no record before the "from" date, it checks for records after the "to" date
 * that have a positive balance.
 *
 * @param {Object} params - The parameters for fetching balances.
 * @param {number} params.userId - The ID of the user for whom balances are to be fetched.
 * @param {number} params.accountId - The ID of the account for which balances are to be fetched.
 * @param {string} [params.from] - The start date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {string} [params.to] - The end date (inclusive) of the date range in 'yyyy-mm-dd' format.
 * @param {GenericSequelizeModelAttributes} [attributes={}] - Additional Sequelize model attributes for the query.
 * @returns {Promise<BalanceModel[]>} - A promise that resolves to an array of balance records.
 * @throws {Error} - Throws an error if the database query fails.
 *
 * @example
 * const balances = await getBalanceHistoryForAccount({ userId: 1, accountId: 1 from: '2023-01-01', to: '2023-12-31' });
 */
export const getBalanceHistoryForAccount = async (
  { userId, from, to, accountId }: {
    userId: number;
    accountId: number;
    from?: string;
    to?: string;
  },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<BalanceModel[]> => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    let data: BalanceModel[] = []

    const dataAttributes = ['date', 'amount'];
    const balancesInRange = await Balances.default.findAll({
      where: getWhereConditionForTime({ from, to }),
      order: [['date', 'ASC']],
      include: [{
        model: Accounts.default,
        where: { userId, id: accountId },
        attributes: [],
      }],
      raw: attributes.raw || true,
      attributes: dataAttributes,
      transaction,
    });

    data = balancesInRange;

    if (!balancesInRange.length) {
      let balanceRecord: BalanceModel;

      if (from) {
        // Check for records before "from" date
        balanceRecord = await Balances.default.findOne({
          where: {
            date: {
              [Op.lt]: new Date(from),
            },
            accountId,
          },
          order: [['date', 'DESC']],
          attributes: dataAttributes,
          raw: attributes.raw ?? true,
          transaction,
        });
      }

      if (!balanceRecord && to) {
        // If no record found before "from" date, check for records after "to"
        // date with amount > 0
        balanceRecord = await Balances.default.findOne({
          where: {
            accountId,
            date: {
              [Op.gt]: new Date(to)
            },
            amount: {
              [Op.gt]: 0
            }
          },
          order: [['date', 'ASC']],
          attributes: dataAttributes,
          raw: attributes.raw ?? true,
          transaction,
        });
      }

      // Combine the results
      data = [
        ...data,
        // filter(Boolean) to remove any null values
        {
          ...balanceRecord,
          date: new Date(to ?? from ?? new Date()),
        },
      ];
    }

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return data;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
