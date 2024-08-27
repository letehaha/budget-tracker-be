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
      refundedByTxIds,
      refundsTxId,
    }: endpointsTypes.UpdateTransactionBody = req.body;
    const { id: userId } = req.user;

    if (amount) validateTransactionAmount(amount);

    if (refundedByTxIds) {
      if (!refundedByTxIds.every((i) => typeof i === 'number')) {
        throw new ValidationError({ message: "'refundTransactionsIds' is invalid" });
      }
    }

    if (refundedByTxIds !== undefined && refundsTxId !== undefined) {
      throw new ValidationError({
        message: "Not allowed to pass both 'refundedByTxIds' and 'refundsTxId'",
      });
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
        refundedByTxIds,
        refundsTxId,
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
