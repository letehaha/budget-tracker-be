import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';

import * as transactionsService from '@services/transactions';
import { ValidationError } from '@js/errors';

export const deleteTransaction = async (req, res: CustomResponse) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    if (!id || !Number(id)) throw new ValidationError({ message: 'Transaction id parameter does not specified in the URL' });

    await transactionsService.deleteTransaction({ id, userId })

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: {},
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
