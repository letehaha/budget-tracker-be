import config from 'config';
import request from 'supertest';
import { ACCOUNT_TYPES } from 'shared-types';
import { app } from '@root/app';

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

export const buildAccountPayload = (overrides = {}) => ({
  accountTypeId: 1,
  currencyId: global.BASE_CURRENCY.id,
  name: 'test',
  type: ACCOUNT_TYPES.system,
  currentBalance: 0,
  creditLimit: 0,
  ...overrides,
});

export const getAccount = ({ accountId, raw = false }) => makeRequest({
  method: 'get',
  url: `/accounts/${accountId}`,
  raw,
});

export const createAccount = ({ payload = buildAccountPayload(), raw = false } = {}) => makeRequest({
  method: 'post',
  url: '/accounts',
  payload,
  raw,
});

export const updateAccount = ({ id, payload = {}, raw = false })  => makeRequest({
  method: 'put',
  url: `/accounts/${id}`,
  payload,
  raw,
});
