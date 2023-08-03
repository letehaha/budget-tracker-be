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
  let tempUrl = url

  if (method === 'get') {
    tempUrl = tempUrl + '?' + new URLSearchParams(payload as Record<string, string>).toString();
  }

  const base = request(app)[method](`${apiPrefix}${tempUrl}`)

  if (global.APP_AUTH_TOKEN) base.set('Authorization', global.APP_AUTH_TOKEN)
  if (payload) base.send(payload);

  return base;
}

export const sleep = (time = 1000) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const randomDate = (start: Date = new Date(2020, 1, 5), end: Date = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
