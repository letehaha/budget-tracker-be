import { API_ERROR_CODES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';

import { CustomError } from '@js/errors'

import * as transactionsService from '@services/transactions';

export const deleteTransaction = async (req, res: CustomResponse) => {
  try {
    const { id, authorId } = req.params;
    const { id: userId } = req.user;

    await transactionsService.deleteTransaction({
      id,
      authorId: authorId ?? userId,
    })

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: {},
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.httpCode).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: err.code,
        },
      });
    }

    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};
