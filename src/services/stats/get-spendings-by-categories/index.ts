import { Op } from 'sequelize';
import { GenericSequelizeModelAttributes, UnwrapPromise } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';
import RefundTransactions from '@models/RefundTransactions.model';

import { getExpensesHistory } from '../get-expenses-history';
import Transactions from '@models/Transactions.model';
import { TRANSACTION_TYPES } from 'shared-types';
import { GetSpendingsByCategoriesReturnType } from '../../../../shared-types/routes';

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
  const transaction = attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const transactions = await getExpensesHistory(params);
    const txIds = transactions.filter((i) => i.refundLinked).map((i) => i.id);
    const refunds = await RefundTransactions.findAll({
      where: {
        [Op.or]: [{ refund_tx_id: { [Op.in]: txIds } }, { original_tx_id: { [Op.in]: txIds } }],
      },
      raw: true,
      transaction: attributes.transaction,
    });

    const categories = await Categories.default.findAll({
      where: { userId: params.userId },
      attributes: ['id', 'parentId', 'name', 'color'],
      raw: true,
      transaction: attributes.transaction,
    });

    const groupedByCategories = await groupAndAdjustData(
      { categories, transactions, refunds },
      { transaction },
    );

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

type TransactionsParam = UnwrapPromise<ReturnType<typeof getExpensesHistory>>;
/**
 * Groups transactions refAmounts per category, and adjusts them based on existing refunds
 */
const groupAndAdjustData = async (
  params: {
    categories: Categories.default[];
    transactions: TransactionsParam;
    refunds: RefundTransactions[];
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const { categories, transactions, refunds } = params;
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
  const result: GetSpendingsByCategoriesReturnType = {};

  // Function to get root category ID
  const getRootCategoryId = (categoryId: number): number => {
    let currentCategory = categoryMap.get(categoryId);
    while (currentCategory && currentCategory.parentId !== null) {
      currentCategory = categoryMap.get(currentCategory.parentId);
    }
    return currentCategory ? currentCategory.id : categoryId;
  };

  transactions.forEach((transaction) => {
    const rootCategoryId = getRootCategoryId(transaction.categoryId).toString();
    const rootCategory = categoryMap.get(Number(rootCategoryId));

    if (rootCategoryId in result) {
      result[rootCategoryId].amount += transaction.refAmount;
    } else {
      result[rootCategoryId] = {
        amount: transaction.refAmount,
        name: rootCategory ? rootCategory.name : 'Unknown',
        color: rootCategory ? rootCategory.color : '#000000',
      };
    }
  });

  // Adjust amounts based on refunds. Uses exactly refAmount, not amount, because stats are always
  // describe ref currency
  for (const refund of refunds) {
    const pair = {
      base: transactions.find((t) => t.id === refund.original_tx_id),
      refund: transactions.find((t) => t.id === refund.refund_tx_id),
    };
    const findByPkParams = {
      transaction: attributes.transaction,
      raw: true,
      attributes: ['refAmount', 'categoryId', 'transactionType'],
    };

    // In case not found refund transactions in current time period, fetch them separately regardless
    // of time period.
    if (!pair.base) pair.base = await Transactions.findByPk(refund.original_tx_id, findByPkParams);
    if (!pair.refund) {
      pair.refund = await Transactions.findByPk(refund.refund_tx_id, findByPkParams);
    }

    // We always need to adjust spendings exactly for expense transactions
    const wantedCategoryId =
      pair.base.transactionType === TRANSACTION_TYPES.expense
        ? pair.base.categoryId
        : pair.refund.categoryId;
    const rootCategoryId = getRootCategoryId(wantedCategoryId).toString();

    if (rootCategoryId in result) {
      result[rootCategoryId].amount -= pair.refund.refAmount;
    }
  }

  // TODO: store result to Redis, make the key be based on the from-to-accountId

  return result;
};
