import { MonobankTrasnactionModel, MonobankUserModel, MonobankAccountModel } from 'shared-types';
import { BodyPayload, QueryPayload } from './index'

export interface UpdateMonobankTransactionBody extends BodyPayload {
  id: number;
  categoryId?: number;
  note?: string;
}

export interface PairMonobankAccountBody extends BodyPayload {
  token: MonobankUserModel['apiToken']
}

export interface UpdateMonobankUserBody extends BodyPayload {
  apiToken?: string;
  name?: string;
  webHookUrl?: string;
  clientId?: string;
}

export interface UpdateMonobankAccountByIdBody extends BodyPayload {
  accountId: string;
  name?: MonobankAccountModel['name'];
  isEnabled?: boolean;
  // We store array of pans as a string
  maskedPan?: string;
  type?: MonobankAccountModel['type'];
  iban?: MonobankAccountModel['iban'];
  balance?: MonobankAccountModel['balance'];
  creditLimit?: MonobankAccountModel['creditLimit'];
  currencyId?: number;
}

export type GetMonobankAccountsResponse = MonobankAccountModel[]

export interface LoadMonoTransactionsQuery extends QueryPayload {
  from: string;
  to: string;
  accountId: string;
}
export interface LoadMonoTransactionsResponse {
  minutesToFinish: number;
}

export interface GetMonobankTransactionsQuery extends QueryPayload {
  sort?: 'asc' | 'desc';
  includeUser?: string;
  includeAccount?: string;
  includeCategory?: string;
  includeAll?: string;
  nestedInclude?: string;
  from?: string;
  limit?: string;
}
export type GetMonobankTransactionsResponse = MonobankTrasnactionModel[]
