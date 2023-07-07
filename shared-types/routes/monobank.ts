import { MonobankUserModel } from 'shared-types';
import { BodyPayload } from './index'

export interface UpdateMonobankTransactionBody extends BodyPayload<{
  id: number;
  categoryId?: number;
  note?: string;
}> {}

export interface PairMonobankAccountBody extends BodyPayload<{
  token: MonobankUserModel['apiToken']
}> {}

export interface UpdateMonobankUserBody extends BodyPayload<{
  apiToken?: string;
  name?: string;
  webHookUrl?: string;
  clientId?: string;
}> {}
