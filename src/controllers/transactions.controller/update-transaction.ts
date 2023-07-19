import { API_ERROR_CODES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';

import { CustomError } from '@js/errors'

import * as transactionsService from '@services/transactions';

import { validateTransactionAmount } from './helpers';

export const updateTransaction = async (req, res: CustomResponse) => {
  try {
    const { id } = req.params;
    const {
      amount,
      destinationAmount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      isTransfer,
    } = req.body;
    const { id: userId } = req.user;

    validateTransactionAmount(amount);

    const data = await transactionsService.updateTransaction({
      id,
      amount,
      destinationAmount,
      note,
      time,
      userId,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      isTransfer,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
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
