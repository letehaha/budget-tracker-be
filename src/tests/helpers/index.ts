import config from 'config';
import { Response } from 'express';
import request from 'supertest';
import { startOfDay } from 'date-fns';
import { ACCOUNT_TYPES, TRANSACTION_TYPES, endpointsTypes } from 'shared-types';
import { app } from '@root/app';
import Accounts from '@models/Accounts.model';

const apiPrefix = config.get('apiPrefix');

export const extractResponse = response => response?.body?.response;

export const makeRequest = async (
  { url, method, payload = null, headers = {}, raw = false }:
  {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete';
    payload?: object;
    headers?: object;
    raw?: boolean;
  }
) => {
  let tempUrl = url

  if (method === 'get') {
    tempUrl = tempUrl + '?' + new URLSearchParams(payload as Record<string, string>).toString();
  }

  const base = request(app)[method](`${apiPrefix}${tempUrl}`)

  if (global.APP_AUTH_TOKEN) base.set('Authorization', global.APP_AUTH_TOKEN)
  if (Object.keys(headers).length) base.set(headers);
  if (payload) base.send(payload);

  const result = await base;
  return raw ? extractResponse(result) : result;
}

export const sleep = (time = 1000) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const randomDate = (start: Date = new Date(2020, 1, 5), end: Date = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const buildAccountPayload = (overrides: Partial<endpointsTypes.CreateAccountBody> = {}): endpointsTypes.CreateAccountBody => ({
  accountTypeId: 1,
  currencyId: global.BASE_CURRENCY.id,
  name: 'test',
  type: ACCOUNT_TYPES.system,
  initialBalance: 0,
  creditLimit: 0,
  ...overrides,
});
type BuildAccountPayload = ReturnType<typeof buildAccountPayload>

export const buildTransactionPayload = ({ accountId, type = TRANSACTION_TYPES.expense }) => ({
  accountId,
  amount: 1000,
  categoryId: 1,
  isTransfer: false,
  paymentType: 'creditCard',
  time: startOfDay(new Date()),
  transactionType: type,
  type: ACCOUNT_TYPES.system,
});

export function getAccount({ id, raw }: { id: number, raw: false }): Promise<Response>;
export function getAccount({ id, raw }: { id: number, raw: true }): Promise<Accounts>;
export function getAccount({ id, raw = false }): Promise<Response | Accounts> {
  return makeRequest({
    method: 'get',
    url: `/accounts/${id}`,
    raw,
  });
}

export function createAccount(): Promise<Response>;
export function createAccount({ payload, raw }: { payload?: BuildAccountPayload, raw: false }): Promise<Response>;
export function createAccount({ payload, raw }: { payload?: BuildAccountPayload, raw: true }): Promise<Accounts>;
export function createAccount({ payload = buildAccountPayload(), raw = false } = {}): Promise<Response | Accounts> {
  return makeRequest({
    method: 'post',
    url: '/accounts',
    payload,
    raw,
  });
}

export function updateAccount({ id, raw }: { id: number, payload?: Partial<BuildAccountPayload>, raw?: false }): Promise<Response>;
export function updateAccount({ id, raw }: { id: number, payload?: Partial<BuildAccountPayload>, raw?: true }): Promise<Accounts>;
export function updateAccount({ id, payload = {}, raw = false }) {
  return makeRequest({
    method: 'put',
    url: `/accounts/${id}`,
    payload,
    raw,
  });
}
