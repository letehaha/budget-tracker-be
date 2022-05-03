import type { Response } from 'express';

export enum RESPONSE_STATUS {
  error = 'error',
  success = 'success',
}

export enum TRANSACTION_TYPES {
  income = 1,
  expense = 2,
  transfer = 3,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;
export interface CustomResponse extends Response {
  json: Send<{
    status: RESPONSE_STATUS,
    response?: unknown,
  }, this>
}

export * from './error-codes';
export * from './models';
