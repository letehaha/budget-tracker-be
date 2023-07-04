import { ERROR_CODES } from 'shared-types';
import { RESPONSE_STATUS } from '@common/types';
import { CustomError } from '@js/errors';
import { logger} from '@js/utils/logger';

export function errorHandler(res, err: Error) {
  if (err instanceof CustomError) {
    return res.status(err.httpCode).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
  }

  logger.error(err);
  return res.status(500).json({
    status: RESPONSE_STATUS.error,
    response: {
      message: 'Unexpected error.',
      code: ERROR_CODES.unexpected,
    },
  });
}
