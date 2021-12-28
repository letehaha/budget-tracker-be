import * as TransactionTypes from '../models/TransactionTypes.model';

export const getTransactionTypes = async (req, res, next) => {
  try {
    const data = await TransactionTypes.getTransactionTypes();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};