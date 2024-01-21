import {
  ACCOUNT_TYPES,
  SORT_DIRECTIONS,
  TRANSACTION_TYPES,
} from 'shared-types';

export interface GetTransactionsParams {
  userId: number;
  sortDirection: SORT_DIRECTIONS;
  includeUser: boolean;
  includeAccount: boolean;
  includeCategory: boolean;
  includeAll: boolean;
  nestedInclude: boolean;
  transactionType: TRANSACTION_TYPES;
  limit: number;
  from: number;
  accountType: ACCOUNT_TYPES;
  accountId: number;
  isRaw: boolean;
  excludeTransfer?: boolean;
}
