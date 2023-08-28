import { GenericSequelizeModelAttributes, UnwrapPromise, UnwrapArray } from '@common/types';

import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';

import { getExpensesHistory } from './get-expenses-history';

type TransactionEntity = UnwrapPromise<ReturnType<typeof getExpensesHistory>>;
interface TransactionGroup {
  transactions: TransactionEntity;
  nestedCategories: { [categoryId: number]: TransactionGroup };
}
type GroupedData = { [categoryId: number]: TransactionGroup }

const groupData = (categories: Categories.default[], transactions: TransactionEntity) => {
  const categoryMap = new Map<number, Categories.default>();

  for (const category of categories) {
    categoryMap.set(category.id, category);
  }

  const insertTransactionIntoStructure = (structure: GroupedData, category: Categories.default, transaction: UnwrapArray<TransactionEntity>) => {
    if (!category.parentId) {
      if (!structure[category.id]) {
        structure[category.id] = {
          transactions: [],
          nestedCategories: {},
        };
      }
      structure[category.id].transactions.push(transaction);
    } else {
      const parentCategory = categoryMap.get(category.parentId);
      if (parentCategory) {
        if (!structure[parentCategory.id]) {
          structure[parentCategory.id] = {
            transactions: [],
            nestedCategories: {},
          };
        }
        if (!structure[parentCategory.id].nestedCategories[category.id]) {
          structure[parentCategory.id].nestedCategories[category.id] = {
            transactions: [],
            nestedCategories: {},
          };
        }
        structure[parentCategory.id].nestedCategories[category.id].transactions.push(transaction);
      }
    }
  };

  const groupedData: GroupedData = {};

  for (const transaction of transactions) {
    const category = categoryMap.get(transaction.categoryId);
    if (category) {
      insertTransactionIntoStructure(groupedData, category, transaction);
    }
  }

  return groupedData;
}

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
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

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
    console.log('err', err);
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};
