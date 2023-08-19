import { QueryPayload } from './index'

export interface GetBalanceHistoryPayload extends QueryPayload {
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
}

export interface GetTotalBalancePayload extends QueryPayload {
  date: string;
}
