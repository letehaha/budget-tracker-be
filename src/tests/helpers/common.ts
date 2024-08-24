import config from 'config';
import request from 'supertest';
import { app } from '@root/app';

const apiPrefix = config.get('apiPrefix');

interface MakeRequestParams {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  payload?: object;
  headers?: object;
  raw?: boolean;
}

export const extractResponse = (response) => response?.body?.response;

export async function makeRequest({
  url,
  method,
  payload = null,
  headers = {},
  raw = false,
}: MakeRequestParams) {
  let tempUrl = url;

  if (method === 'get') {
    tempUrl = tempUrl + '?' + new URLSearchParams(payload as Record<string, string>).toString();
  }

  const base = request(app)[method](`${apiPrefix}${tempUrl}`);

  if (global.APP_AUTH_TOKEN) base.set('Authorization', global.APP_AUTH_TOKEN);
  if (Object.keys(headers).length) base.set(headers);
  if (payload) base.send(payload);

  const result = await base;
  return raw ? extractResponse(result) : result;
}

export const sleep = (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const randomDate = (start: Date = new Date(2020, 1, 5), end: Date = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
