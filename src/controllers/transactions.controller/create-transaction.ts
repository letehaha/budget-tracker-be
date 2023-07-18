import { API_ERROR_CODES, ACCOUNT_TYPES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';

import { CustomError} from '@js/errors'

import * as transactionsService from '@services/transactions';

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

    let data = await transactionsService.createTransaction({
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
      isTransfer,
    });

    if (data[0].dataValues) {
      data = data.map(d => d.dataValues ?? d)
    }

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
