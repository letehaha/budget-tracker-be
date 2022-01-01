import { RESPONSE_STATUS, CustomResponse } from 'shared-types';
import * as PaymentTypes from '../models/PaymentTypes.model';

export const getPaymentTypes = async (req, res: CustomResponse, next) => {
  try {
    const data = await PaymentTypes.getPaymentTypes();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return next(new Error(err));
  }
};
