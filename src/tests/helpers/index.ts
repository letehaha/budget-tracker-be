import config from 'config';
import { Response } from 'express';
import request from 'supertest';
import { startOfDay } from 'date-fns';
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  endpointsTypes,
  TRANSACTION_TRANSFER_NATURE,
  TransactionModel,
  PAYMENT_TYPES,
} from 'shared-types';
import { app } from '@root/app';
import Accounts from '@models/Accounts.model';
import Transactions from '@models/Transactions.model';
import ExchangeRates from '@models/ExchangeRates.model';
import UsersCurrencies from '@models/UsersCurrencies.model';
import monobank from './monobank';

export { monobank };
export * from './account';

const apiPrefix = config.get('apiPrefix');

export const extractResponse = (response) => response?.body?.response;

interface MakeRequestParams {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  payload?: object;
  headers?: object;
  raw?: boolean;
}

export async function makeRequest({
  url,
  method,
  payload = null,
  headers = {},
  raw = false,
}: MakeRequestParams) {
  let tempUrl = url;

  if (method === 'get') {
    tempUrl =
      tempUrl +
      '?' +
      new URLSearchParams(payload as Record<string, string>).toString();
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

export const randomDate = (
  start: Date = new Date(2020, 1, 5),
  end: Date = new Date(),
) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

export const buildAccountPayload = (
  overrides: Partial<endpointsTypes.CreateAccountBody> = {},
): endpointsTypes.CreateAccountBody => ({
  accountTypeId: 1,
  currencyId: global.BASE_CURRENCY.id,
  name: 'test',
  type: ACCOUNT_TYPES.system,
  initialBalance: 0,
  creditLimit: 0,
  ...overrides,
});
type BuildAccountPayload = ReturnType<typeof buildAccountPayload>;

export const buildTransactionPayload = ({
  accountId,
  ...overrides
}: { accountId: number } & ReturnType<
  typeof buildTransactionPayload
>): TransactionModel => ({
  accountId,
  amount: 1000,
  categoryId: 1,
  transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
  paymentType: PAYMENT_TYPES.creditCard,
  time: startOfDay(new Date()),
  transactionType: TRANSACTION_TYPES.expense,
  accountType: ACCOUNT_TYPES.system,
  ...overrides,
});

export function getAccount({
  id,
  raw,
}: {
  id: number;
  raw: false;
}): Promise<Response>;
export function getAccount({
  id,
  raw,
}: {
  id: number;
  raw: true;
}): Promise<Accounts>;
export function getAccount({ id, raw = false }: { id: number; raw?: boolean }) {
  return makeRequest({
    method: 'get',
    url: `/accounts/${id}`,
    raw,
  });
}

export function getAccounts(): Promise<Accounts[]> {
  return makeRequest({
    method: 'get',
    url: `/accounts`,
    raw: true,
  });
}

/**
 * Creates an account. By default for base currency, but any payload can be passed
 */
export function createAccount(): Promise<Response>;
export function createAccount({
  payload,
  raw,
}: {
  payload?: BuildAccountPayload;
  raw: false;
}): Promise<Response>;
export function createAccount({
  payload,
  raw,
}: {
  payload?: BuildAccountPayload;
  raw: true;
}): Promise<Accounts>;
export function createAccount({
  payload = buildAccountPayload(),
  raw = false,
} = {}) {
  return makeRequest({
    method: 'post',
    url: '/accounts',
    payload,
    raw,
  });
}

export function updateAccount({
  id,
  payload,
  raw,
}: {
  id: number;
  payload?: Partial<BuildAccountPayload>;
  raw?: false;
}): Promise<Response>;
export function updateAccount({
  id,
  payload,
  raw,
}: {
  id: number;
  payload?: Partial<BuildAccountPayload>;
  raw?: true;
}): Promise<Accounts>;
export function updateAccount({ id, payload = {}, raw = false }) {
  return makeRequest({
    method: 'put',
    url: `/accounts/${id}`,
    payload,
    raw,
  });
}

interface CreateTransactionBasePayload {
  payload?: ReturnType<typeof buildTransactionPayload>;
}

export async function createTransaction(): Promise<Response>;
export async function createTransaction({
  raw,
  payload,
}: CreateTransactionBasePayload & { raw?: false }): Promise<Response>;
export async function createTransaction({
  raw,
  payload,
}: CreateTransactionBasePayload & { raw?: true }): Promise<
  [baseTx: Transactions, oppositeTx?: Transactions]
>;
export async function createTransaction({
  raw = false,
  payload = undefined,
} = {}) {
  let txPayload: ReturnType<typeof buildTransactionPayload> = payload;

  if (payload === undefined) {
    const account = await createAccount({ raw: true });
    txPayload = buildTransactionPayload({ accountId: account.id });
  }
  return makeRequest({
    method: 'post',
    url: '/transactions',
    payload: txPayload,
    raw,
  });
}

interface UpdateTransactionBasePayload {
  id: number;
  payload?: Partial<ReturnType<typeof buildTransactionPayload>> & {
    destinationAmount?: number;
    destinationAccountId?: number;
    destinationTransactionId?: number;
  };
}

export function updateTransaction({
  raw,
  payload,
  id,
}: UpdateTransactionBasePayload & { raw?: false }): Promise<Response>;
export function updateTransaction({
  raw,
  payload,
  id,
}: UpdateTransactionBasePayload & { raw?: true }): Promise<
  [baseTx: Transactions, oppositeTx?: Transactions]
>;
export function updateTransaction({ raw = false, id, payload = {} }) {
  return makeRequest({
    method: 'put',
    url: `/transactions/${id}`,
    payload,
    raw,
  });
}

export function deleteTransaction({
  id,
}: { id?: number } = {}): Promise<Response> {
  return makeRequest({
    method: 'delete',
    url: `/transactions/${id}`,
  });
}

export function getTransactions(): Promise<Response>;
export function getTransactions({ raw }: { raw?: false }): Promise<Response>;
export function getTransactions({
  raw,
}: {
  raw?: true;
}): Promise<Transactions[]>;
export function getTransactions({ raw = false } = {}) {
  return makeRequest({
    method: 'get',
    url: '/transactions',
    raw,
  });
}

export async function getCurrenciesRates({
  codes,
}: { codes?: string[] } = {}): Promise<ExchangeRates[]> {
  const data = await makeRequest({
    method: 'get',
    url: '/user/currencies/rates',
    raw: true,
  });

  return codes ? data.filter((item) => codes.includes(item.baseCode)) : data;
}

interface AddUserCurrenciesBaseParams {
  currencyIds?: number[];
  currencyCodes?: string[];
  raw?: true | false;
}
export function addUserCurrencies({
  currencyIds,
  currencyCodes,
  raw,
}: AddUserCurrenciesBaseParams & { raw?: false }): Promise<Response>;
export function addUserCurrencies({
  currencyIds,
  currencyCodes,
  raw,
}: AddUserCurrenciesBaseParams & { raw?: true }): Promise<UsersCurrencies[]>;
export function addUserCurrencies({
  currencyIds = [],
  currencyCodes = [],
  raw = false,
}: AddUserCurrenciesBaseParams = {}) {
  return makeRequest({
    method: 'post',
    url: '/user/currencies',
    payload: {
      currencies: [
        ...currencyIds.map((id) => ({ currencyId: id })),
        ...currencyCodes.map((code) => ({
          currencyId: global.MODELS_CURRENCIES.find(
            (item) => item.code === code,
          ).id,
        })),
      ],
    },
    raw,
  });
}
