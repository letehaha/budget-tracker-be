import { endpointsTypes } from 'shared-types';

declare module 'express' {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: endpointsTypes.BodyPayload<any>;
    requestId?: string; // Optional requestId property
  }
}
