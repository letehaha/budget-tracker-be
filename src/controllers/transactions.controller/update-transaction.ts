import {
  CustomResponse,
  ERROR_CODES,
  RESPONSE_STATUS,
} from 'shared-types';

import { CustomError } from '@js/errors'

import * as transactionsService from '@services/transactions.service';

import { validateTransactionAmount } from './helpers';

export const updateTransaction = async (req, res: CustomResponse) => {
  try {
    const { id } = req.params;
    const {
      amount,
      destinationAmount,
      currencyId,
      currencyCode,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      isTransfer,
      destinationCurrencyId,
      destinationCurrencyCode,
    } = req.body;
    const { id: authorId } = req.user;

    validateTransactionAmount(amount);

    const data = await transactionsService.updateTransaction({
      id,
      amount,
      destinationAmount,
      currencyId,
      currencyCode,
      note,
      time,
      authorId,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      isTransfer,
      destinationCurrencyId,
      destinationCurrencyCode,
    });

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
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
