import { RESPONSE_STATUS, CustomResponse, ERROR_CODES } from 'shared-types';

import * as TransactionEntities from '../models/TransactionEntities.model';

export const getTransactionEntities = async (req, res: CustomResponse) => {
  try {
    const data = await TransactionEntities.getTransactionEntities();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: ERROR_CODES.unexpected,
      },
    });
  }
};
