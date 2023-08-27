import { AccountModel, TransactionModel } from '../models';
import { QueryPayload } from './index'

export interface GetBalanceHistoryPayload extends QueryPayload {
  accountId?: AccountModel['id'];
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
}

export interface GetTotalBalancePayload extends QueryPayload {
  date: string;
}

export interface GetSpendingCategoriesPayload extends QueryPayload {
  accountId?: AccountModel['id'];
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
  raw?: boolean;
}

// TODO: Improve that logic and expose type from the source-code.
// Currently frontend (vite) complains about it and trying to import source code
type TransactionEntity = Pick<
  TransactionModel,
  'accountId' | 'time' | 'amount' | 'refAmount' | 'currencyId' | 'currencyCode' | 'categoryId'
>[];

interface TransactionGroup {
  transactions: TransactionEntity;
  nestedCategories: { [categoryId: number]: TransactionGroup };
}
export type GetSpendingsByCategoriesReturnType = { [categoryId: number]: TransactionGroup }
