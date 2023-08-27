import type { Response } from 'express';
import { Transaction } from 'sequelize/types';
import { API_RESPONSE_STATUS } from 'shared-types';

// Enforce res.json(object) to always have `status` field and optional `response`
// with ability to pass `response` type using res.json<Type>()
type Send<T = Response> = {
  <ResBody>(body: {
    response?: ResBody,
    status: API_RESPONSE_STATUS,
  }): T;
};
export interface CustomResponse extends Response {
  json: Send<this>;
}


export interface GenericSequelizeModelAttributes {
  transaction?: Transaction;
  raw?: boolean;
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type UnwrapArray<T> = T extends (infer U)[] ? U : T;
