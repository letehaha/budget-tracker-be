import type { Response } from 'express';
import { Transaction } from 'sequelize/types';
import { API_RESPONSE_STATUS } from 'shared-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;
export interface CustomResponse extends Response {
  json: Send<{
    status: API_RESPONSE_STATUS,
    response?: unknown,
  }, this>
}


export interface GenericSequelizeModelAttributes {
  transaction?: Transaction,
}


/**
 * More info here:
 *
 * @link https://api.monobank.ua/docs/#tag/Kliyentski-personalni-dani/paths/~1personal~1client-info/get
 */
export interface MonobankClientInfoResponse {
  clientId: string;
  name: string;
  webHookUrl: string;
  permissions: string;
  accounts: {
    id: string;
    sendId: string;
    balance: number;
    creditLimit: number;
    type: 'black' | 'white' | 'platinum' | 'iron' | 'fop' | 'yellow' | 'eAid';
    currencyCode: number;
    cashbackType: 'None' | 'UAH' | 'Miles';
    maskedPan: string[];
    iban: string;
  }[];
  jars: {
    id: string;
    sendId: string;
    title: string;
    description: string;
    currencyCode: number;
    balance: number;
    goal: number;
  }[]
}

/**
 * More info
 *
 * @link https://api.monobank.ua/docs/#tag/Kliyentski-personalni-dani/paths/~1personal~1webhook/post
 */
export type MonobankTransactionResponse = {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc: number;
  hold: boolean;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  comment: string;
  receiptId: string;
  invoiceId: string;
  counterEdrpou: string;
  counterIban: string;
  counterName: string;
}
