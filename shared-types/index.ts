import type { Response } from 'express';

export enum RESPONSE_STATUS {
  error = 'error',
  success = 'success',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;
export interface CustomResponse extends Response {
  json: Send<{
    status: RESPONSE_STATUS,
    response?: unknown,
  }, this>
}

export enum ACCOUNT_TYPES {
  system = 'system',
  monobank = 'monobank',
}

export enum PAYMENT_TYPES {
  bankTransfer = 'bankTransfer',
  voucher = 'voucher',
  webPayment = 'webPayment',
  cash = 'cash',
  mobilePayment = 'mobilePayment',
  creditCard = 'creditCard',
  debitCard = 'debitCard',
}

export enum TRANSACTION_TYPES {
  income = 'income',
  expense = 'expense',
  transfer = 'transfer',
}

export enum CATEGORY_TYPES {
  custom = 'custom',
  internal = 'internal',
}

export * from './error-codes';
