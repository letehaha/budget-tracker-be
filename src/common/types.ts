import * as Express from 'express';
import { ZodIssue, z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import Users from '@models/Users.model';

// Enforce res.json(object) to always have `status` field and optional `response`
// with ability to pass `response` type using res.json<Type>()
type Send<T = Response> = {
  <ResBody>(body: {
    response?: ResBody;
    validationErrors?: ZodIssue[];
    status: API_RESPONSE_STATUS;
  }): T;
};
export interface CustomRequest<T extends z.ZodType> extends Express.Request {
  validated: z.infer<T>;
  user: Users;
}
export interface CustomResponse extends Express.Response {
  json: Send<this>;
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type UnwrapArray<T> = T extends (infer U)[] ? U : T;
