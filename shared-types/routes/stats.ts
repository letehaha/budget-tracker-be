import { AccountModel } from '../models';
import { QueryPayload } from './index'

export interface GetBalanceHistoryPayload extends QueryPayload {
  accountId?: AccountModel['id'];
  // dd-mm-yyyy
  from?: string;
  // dd-mm-yyyy
  to?: string;
}
