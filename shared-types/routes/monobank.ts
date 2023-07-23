import { MonobankUserModel } from 'shared-types';
import { BodyPayload, QueryPayload } from './index'

export interface PairMonobankAccountBody extends BodyPayload {
  token: MonobankUserModel['apiToken']
}

export interface UpdateMonobankUserBody extends BodyPayload {
  apiToken?: MonobankUserModel['apiToken'];
  name?: MonobankUserModel['name'];
  webHookUrl?: MonobankUserModel['webHookUrl'];
  clientId?: MonobankUserModel['clientId'];
}

export interface LoadMonoTransactionsQuery extends QueryPayload {
  from: number;
  to: number;
  accountId: number;
}
export interface LoadMonoTransactionsResponse {
  minutesToFinish: number;
}

export interface UpdateWebhookBody extends BodyPayload {
  clientId: string;
}
