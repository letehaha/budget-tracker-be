import config from 'config';
import { CustomResponse as ExpressCustomResponse } from '@common/types';
import request from 'supertest';
import { app } from '@root/app';
import { API_ERROR_CODES, API_RESPONSE_STATUS } from '../../../shared-types/api';

const apiPrefix = config.get('apiPrefix');

interface MakeRequestParams<T> {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  payload?: object | null;
  headers?: object;
  raw?: T;
}

export interface CustomResponse<T> extends ExpressCustomResponse {
  body: {
    code: API_ERROR_CODES;
    status: API_RESPONSE_STATUS;
    response: T;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractResponse = <T = any>(response: CustomResponse<T>) => response.body.response;

export type MakeRequestReturn<T, R extends boolean | undefined = false> = R extends true
  ? T
  : CustomResponse<T>;

export interface ErrorResponse {
  message: string;
  code: string;
}

export type UtilizeReturnType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
  R extends boolean | undefined,
> = Promise<MakeRequestReturn<Awaited<ReturnType<T>>, R>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function makeRequest<T = any, R extends boolean | undefined = false>({
  url,
  method,
  payload = null,
  headers = {},
  raw = false,
}: MakeRequestParams<R>): Promise<MakeRequestReturn<T, R>> {
  let tempUrl = url;

  if (method === 'get') {
    tempUrl = tempUrl + '?' + new URLSearchParams(payload as Record<string, string>).toString();
  }

  const base = request(app)[method](`${apiPrefix}${tempUrl}`);

  if (global.APP_AUTH_TOKEN) base.set('Authorization', global.APP_AUTH_TOKEN);
  if (Object.keys(headers).length) base.set(headers);
  if (payload) base.send(payload);

  const result: CustomResponse<T> = await base;
  return (raw ? extractResponse(result) : result) as MakeRequestReturn<T, R>;
}

export const sleep = (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const randomDate = (start: Date = new Date(2020, 1, 5), end: Date = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
