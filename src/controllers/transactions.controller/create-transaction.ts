import {
  CustomResponse,
  ERROR_CODES,
  ACCOUNT_TYPES,
  RESPONSE_STATUS,
} from 'shared-types';

import { CustomError} from '@js/errors'

import * as transactionsService from '@services/transactions.service';

import { validateTransactionAmount } from './helpers';

export const createTransaction = async (req, res: CustomResponse) => {
  try {
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
      currencyId,
      currencyCode,
      destinationCurrencyId,
      destinationCurrencyCode,
      accountType = ACCOUNT_TYPES.system,
      isTransfer,
    } = req.body;
    const { id: authorId } = req.user;

    validateTransactionAmount(amount);

    // Add validations
    // 1. That amount and destinationAmount are integers
    // 2. If isTransfer, then all required fields are passed
    // 3. That passed currencyId exists
    // 4. Amount and destinationAmount with same currency should be equal

    const data = await transactionsService.createTransaction({
      amount,
      destinationAmount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      accountType,
      authorId,
      currencyId,
      currencyCode,
      destinationCurrencyId,
      destinationCurrencyCode,
      isTransfer,
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
