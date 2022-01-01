import { RESPONSE_STATUS, CustomResponse } from 'shared-types';

import * as TransactionEntities from '../models/TransactionEntities.model';

export const getTransactionEntities = async (req, res: CustomResponse, next) => {
  try {
    const data = await TransactionEntities.getTransactionEntities();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return next(new Error(err));
  }
};
