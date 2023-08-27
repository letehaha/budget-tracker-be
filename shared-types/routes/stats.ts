import { GetSpendingsByCategoriesReturnType } from '../../src/services/stats/get-spendings-by-categories';
import { AccountModel } from '../models';
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

export { GetSpendingsByCategoriesReturnType }
