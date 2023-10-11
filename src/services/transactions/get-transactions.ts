import * as Transactions from '@models/Transactions.model';
import { GenericSequelizeModelAttributes } from '@common/types';
import { ACCOUNT_TYPES, SORT_DIRECTIONS, TRANSACTION_TYPES } from 'shared-types';

export const getTransactions = async (
    {
      userId,
      sort,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      transactionType,
      limit,
      from,
      accountType,
      accountId,
      isRaw,
    }: {
      userId: number,
      sort: SORT_DIRECTIONS,
      includeUser: boolean,
      includeAccount: boolean,
      includeCategory: boolean,
      includeAll: boolean,
      nestedInclude: boolean,
      transactionType: string,
      limit: number,
      from: number,
      accountType: ACCOUNT_TYPES,
      accountId: number,
      isRaw: boolean,
    },
    attributes: GenericSequelizeModelAttributes = {},
) => {
  try {
    const data = await Transactions.getTransactions({
      userId,
      sortDirection: sort,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      transactionType,
      nestedInclude,
      limit,
      from,
      accountType,
      accountId,
      isRaw,
    }, 
    { transaction: attributes.transaction });
    
    return data;
  } catch(err) {
    throw new err;
  }
};