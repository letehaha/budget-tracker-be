import { RESPONSE_STATUS, ERROR_CODES } from 'shared-types';
import { CustomError } from '@js/errors';

export function errorHandler(res, err) {
  if (err instanceof CustomError) {
    return res.status(err.httpCode).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // TODO: log error
  console.error(err)
  return res.status(500).json({
    status: RESPONSE_STATUS.error,
    response: {
      message: 'Unexpected error.',
      code: ERROR_CODES.unexpected,
    },
  });
}
