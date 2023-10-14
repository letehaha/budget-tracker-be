import { ACCOUNT_TYPES, SORT_DIRECTIONS } from 'shared-types';

export interface GetTransactionsParams {
  userId: number,
  sortDirection: SORT_DIRECTIONS,
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
  isRaw: boolean
}