import { API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';
import * as transactionsService from '@services/transactions';
import { removeUndefinedKeys } from '@js/helpers';
import { validateTransactionAmount } from './helpers';
import { ValidationError } from '@js/errors';

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
      destinationTransactionId,
      categoryId,
      transferNature,
      refundTransactionsIds,
    }: endpointsTypes.UpdateTransactionBody = req.body;
    const { id: userId } = req.user;

    if (amount) validateTransactionAmount(amount);

    if (refundTransactionsIds) {
      if (!refundTransactionsIds.every((i) => typeof i === 'number')) {
        throw new ValidationError({ message: "'refundTransactionsIds' is invalid" });
      }
    }

    const data = await transactionsService.updateTransaction({
      id,
      ...removeUndefinedKeys({
        amount,
        destinationAmount,
        destinationTransactionId,
        note,
        time: new Date(time),
        userId,
        transactionType,
        paymentType,
        accountId,
        destinationAccountId,
        categoryId,
        transferNature,
        refundTransactionsIds,
      }),
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
