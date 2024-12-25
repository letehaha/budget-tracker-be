import { endpointsTypes } from 'shared-types';
import type { SESSION_ID_KEY_NAME } from '@common/types';

declare module 'express' {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: endpointsTypes.BodyPayload<any>;
    requestId?: string; // Optional requestId property
    [SESSION_ID_KEY_NAME]?: string | null; // Optional sessionId property
  }
}
