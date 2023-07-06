import type { Response } from 'express';
import { API_RESPONSE_STATUS } from 'shared-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;
export interface CustomResponse extends Response {
  json: Send<{
    status: API_RESPONSE_STATUS,
    response?: unknown,
  }, this>
}
