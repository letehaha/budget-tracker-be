import { AccountModel } from '../models';
import { QueryPayload } from './index';

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

export type SpendingStructure = { name: string; color: string; amount: number };
export type GetSpendingsByCategoriesReturnType = { [categoryId: number]: SpendingStructure };
