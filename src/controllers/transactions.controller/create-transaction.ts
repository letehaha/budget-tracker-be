import { ACCOUNT_TYPES, API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';

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
    const { id: userId } = req.user;

    validateTransactionAmount(amount);

    // TODO: Add validations
    // 1. That amount and destinationAmount are integers
    // 2. If isTransfer, then all required fields are passed
    // 3. That passed currencyId exists
    // 4. Amount and destinationAmount with same currency should be equal
    // 5. That transactions here might be created only with system account type

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
      userId,
      isTransfer,
    });

    if (data[0].dataValues) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = data.map(d => d.dataValues ?? d) as any
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
