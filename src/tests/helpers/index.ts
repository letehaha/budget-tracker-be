import config from 'config';
import request from 'supertest';
import { app } from '@root/app';

const apiPrefix = config.get('apiPrefix');

export const extractResponse = response => response.body.response;

export const makeRequest = (
  { url, method, payload = null, token }:
  {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete';
    payload?: object;
    token?: string;
  }
) => {
  const base = request(app)[method](`${apiPrefix}${url}`)

  if (token) base.set('Authorization', token)
  if (payload) base.send(payload);

  return base;
}
