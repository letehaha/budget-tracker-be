import { startOfDay } from 'date-fns';
import { Response } from 'express';
import {
  TRANSACTION_TYPES,
  type endpointsTypes,
  TRANSACTION_TRANSFER_NATURE,
  PAYMENT_TYPES,
} from 'shared-types';
import { CreateTransactionBody } from '../../../shared-types/routes';
import Transactions from '@models/Transactions.model';
import * as transactionsService from '@services/transactions';
import { getTransactions as apiGetTransactions } from '@services/transactions/get-transactions';
import { makeRequest } from './common';
import { createAccount } from './account';

type BuildTxPartialField = 'amount' | 'time' | 'transferNature' | 'paymentType' | 'transactionType';
export const buildTransactionPayload = (
  params: Omit<CreateTransactionBody, BuildTxPartialField> &
    Partial<Pick<CreateTransactionBody, BuildTxPartialField>>,
): CreateTransactionBody => ({
  amount: 1000,
  categoryId: 1,
  transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
  paymentType: PAYMENT_TYPES.creditCard,
  time: startOfDay(new Date()).toISOString(),
  transactionType: TRANSACTION_TYPES.expense,
  ...params,
});

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
}: CreateTransactionBasePayload & { raw?: boolean } = {}) {
  let txPayload: ReturnType<typeof buildTransactionPayload> | undefined = payload;

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
    refundsTxId?: number | null;
    refundedByTxIds?: number[] | null;
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

export function deleteTransaction({ id }: { id?: number } = {}): Promise<Response> {
  return makeRequest({
    method: 'delete',
    url: `/transactions/${id}`,
  });
}

export function getTransactions<R extends boolean | undefined = undefined>({
  raw,
  ...rest
}: { raw?: R } & Partial<Omit<Parameters<typeof apiGetTransactions>[0], 'userId'>> = {}) {
  return makeRequest<Awaited<ReturnType<typeof apiGetTransactions>>, R>({
    method: 'get',
    url: '/transactions',
    payload: rest,
    raw,
  });
}

export function unlinkTransferTransactions({
  transferIds,
  raw,
}: {
  transferIds: string[];
  raw?: false;
}): Promise<Response>;
export function unlinkTransferTransactions({
  raw,
  transferIds,
}: {
  transferIds: string[];
  raw?: true;
}): Promise<Transactions[]>;
export function unlinkTransferTransactions({
  raw = false,
  transferIds = [],
}: {
  transferIds: string[];
  raw?: boolean;
}) {
  return makeRequest({
    method: 'put',
    url: '/transactions/unlink',
    payload: {
      transferIds,
    },
    raw,
  });
}

export function linkTransactions({
  payload,
  raw,
}: {
  payload: endpointsTypes.LinkTransactionsBody;
  raw?: false;
}): Promise<Response>;
export function linkTransactions({
  payload,
  raw,
}: {
  payload: endpointsTypes.LinkTransactionsBody;
  raw?: true;
}): ReturnType<typeof transactionsService.linkTransactions>;
export function linkTransactions({ raw = false, payload }) {
  return makeRequest({
    method: 'put',
    url: '/transactions/link',
    payload,
    raw,
  });
}
