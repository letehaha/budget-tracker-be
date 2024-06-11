import type { Response } from 'express';
import { makeRequest } from '@tests/helpers';
import * as holdingsService from '@services/investments/holdings';

type CreateHoldingPayload = Omit<
  Parameters<typeof holdingsService.createHolding>[0],
  'userId'
>;

export function createHolding({
  payload,
  raw,
}: {
  payload: CreateHoldingPayload;
  raw?: false;
}): Promise<Response>;
export function createHolding({
  payload,
  raw,
}: {
  payload: CreateHoldingPayload;
  raw?: true;
}): ReturnType<typeof holdingsService.createHolding>;
export function createHolding({ raw = false, payload }) {
  return makeRequest({
    method: 'post',
    url: '/investing/holdings',
    payload,
    raw,
  });
}

export function getHoldings({ raw }: { raw?: false }): Promise<Response>;
export function getHoldings({
  raw,
}: {
  raw?: true;
}): ReturnType<typeof holdingsService.loadHoldingsList>;
export function getHoldings({ raw = false }) {
  return makeRequest({
    method: 'get',
    url: '/investing/holdings',
    raw,
  });
}
