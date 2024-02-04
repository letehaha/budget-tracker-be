import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';

import { getExpensesHistory } from '../get-expenses-history';
import { groupData } from './utils';

export const getSpendingsByCategories = async (
  params: {
    userId: number;
    accountId?: number;
    from?: string;
    to?: string;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const transactions = await getExpensesHistory(params);

    const categories = await Categories.default.findAll({
      where: { userId: params.userId },
      attributes: ['id', 'parentId'],
      raw: true,
      transaction: attributes.transaction,
    });

    const groupedByCategories = groupData(categories, transactions);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return groupedByCategories;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
