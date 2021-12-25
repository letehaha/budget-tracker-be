import * as PaymentTypes from '../models/PaymentTypes.model';

export const getPaymentTypes = async (req, res, next) => {
  try {
    const data = await PaymentTypes.getPaymentTypes();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
