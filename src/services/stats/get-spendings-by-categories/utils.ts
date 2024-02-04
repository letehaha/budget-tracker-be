import type { UnwrapPromise } from '@common/types';
import * as Categories from '@models/Categories.model';

import { getExpensesHistory } from '../get-expenses-history';

export type TransactionEntity = UnwrapPromise<ReturnType<typeof getExpensesHistory>>;
interface TransactionGroup {
  id: number;
  transactions: TransactionEntity;
  nestedCategories: { [categoryId: number]: TransactionGroup };
}

export const groupData = (
  categories: Categories.default[],
  transactions: TransactionEntity,
) => {
  const nodes: { [key: number]: TransactionGroup } = {};
  const roots: { [key: number]: TransactionGroup } = {};

  // Initialize all categories as nodes
  categories.forEach(category => {
    nodes[category.id] = { id: category.id, nestedCategories: {}, transactions: [] };
  });

  // Build the tree
  categories.forEach(category => {
    if (category.parentId === null) {
      roots[category.id] = nodes[category.id];
    } else if (nodes[category.parentId]) {
      nodes[category.parentId].nestedCategories[category.id] = nodes[category.id];
    }
  });

  // Assign transactions to their respective categories
  transactions.forEach(transaction => {
    if (nodes[transaction.categoryId]) {
      nodes[transaction.categoryId].transactions.push(transaction);
    }
  });

  // Function to recursively filter out empty nodes
  const filterEmptyNodes = (node: TransactionGroup): boolean => {
    const nestedCategories = node.nestedCategories;
    for (const categoryId in nestedCategories) {
      if (!filterEmptyNodes(nestedCategories[categoryId])) {
        delete nestedCategories[categoryId];
      }
    }
    return node.transactions.length > 0 || Object.keys(nestedCategories).length > 0;
  };

  // Filter roots based on transactions and nested categories having transactions
  Object.keys(roots).forEach(rootId => {
    if (!filterEmptyNodes(roots[rootId])) {
      delete roots[rootId];
    }
  });

  return roots;
};
