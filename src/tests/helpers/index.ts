import config from 'config';
import request from 'supertest';
import { app } from '@root/app';

const apiPrefix = config.get('apiPrefix');

export const extractResponse = response => response.body.response;

export const makeRequest = (
  { url, method, payload = null }:
  {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete';
    payload?: object;
  }
) => {
  const base = request(app)[method](`${apiPrefix}${url}`)

  if (global.APP_AUTH_TOKEN) base.set('Authorization', global.APP_AUTH_TOKEN)
  if (payload) base.send(payload);

  return base;
}
