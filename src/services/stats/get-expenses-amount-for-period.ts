import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import { getExpensesHistory } from './get-expenses-history';

export const getExpensesAmountForPeriod = async (
  params: Parameters<typeof getExpensesHistory>[0],
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const transactions = await getExpensesHistory(params);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return transactions.reduce((acc, curr) => acc + curr.refAmount, 0);
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
