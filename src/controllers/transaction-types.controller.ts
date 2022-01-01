import { RESPONSE_STATUS, CustomResponse } from 'shared-types';

import * as TransactionTypes from '../models/TransactionTypes.model';

export const getTransactionTypes = async (req, res: CustomResponse, next) => {
  try {
    const data = await TransactionTypes.getTransactionTypes();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return next(new Error(err));
  }
};
