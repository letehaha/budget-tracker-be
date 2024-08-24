import { GenericSequelizeModelAttributes } from '@common/types';

import { connection } from '@models/index';
import { getSpendingsByCategories } from './get-spendings-by-categories/index';

export const getExpensesAmountForPeriod = async (
  params: Parameters<typeof getSpendingsByCategories>[0],
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const spendingsByCategories = await getSpendingsByCategories(params);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return Object.values(spendingsByCategories).reduce((acc, curr) => acc + curr.amount, 0);
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
