import {
  CustomResponse,
  ERROR_CODES,
  RESPONSE_STATUS,
} from 'shared-types';

import { CustomError } from '@js/errors'

import * as transactionsService from '@services/transactions.service';

export const deleteTransaction = async (req, res: CustomResponse) => {
  try {
    const { id, authorId } = req.params;
    const { id: userId } = req.user;

    await transactionsService.deleteTransaction({
      id,
      authorId: authorId ?? userId,
    })

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: {},
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.httpCode).json({
        status: RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: err.code,
        },
      });
    }

    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};
