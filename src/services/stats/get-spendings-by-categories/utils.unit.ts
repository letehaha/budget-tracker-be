import Categories from '@models/Categories.model';
import { groupData, type TransactionEntity } from './utils';
import { UnwrapArray } from '@common/types';

const SOURCE_CATEGORIES: Partial<Categories>[] = [
  { id: 1, parentId: null },
  { id: 2, parentId: null },
  { id: 3, parentId: null },
  { id: 12, parentId: 1 },
  { id: 13, parentId: 1 },
  { id: 15, parentId: 2 },
  { id: 16, parentId: 2 },
  { id: 30, parentId: 15 },
  { id: 31, parentId: 31 },
  { id: 32, parentId: 13 },
  { id: 33, parentId: 16 },
  { id: 34, parentId: 33 },
];

const SOURCE_TRANSACTIONS: Partial<UnwrapArray<TransactionEntity>>[] = [
  { categoryId: 1 },
  { categoryId: 1 },
  { categoryId: 13 },
  { categoryId: 2 },
  { categoryId: 3 },
  { categoryId: 15 },
  { categoryId: 30 },
];

describe('[get-spendings-by-categories]: Group transactions by categories', () => {
  it('groups data correctly', () => {
    const result = groupData(
      SOURCE_CATEGORIES as Categories[],
      SOURCE_TRANSACTIONS as TransactionEntity,
    );

    expect(result).toEqual({
      '1': {
        id: 1,
        nestedCategories: {
          '13': {
            id: 13,
            nestedCategories: {},
            transactions: [{ categoryId: 13 }],
          },
        },
        transactions: [{ categoryId: 1 }, { categoryId: 1 }],
      },
      '2': {
        id: 2,
        nestedCategories: {
          '15': {
            id: 15,
            nestedCategories: {
              '30': {
                id: 30,
                nestedCategories: {},
                transactions: [{ categoryId: 30 }],
              },
            },
            transactions: [{ categoryId: 15 }],
          },
        },
        transactions: [{ categoryId: 2 }],
      },
      '3': { id: 3, nestedCategories: {}, transactions: [{ categoryId: 3 }] },
    });
  });
});
