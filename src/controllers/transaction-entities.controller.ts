import * as TransactionEntities from '../models/TransactionEntities.model';

export const getTransactionEntities = async (req, res, next) => {
  try {
    const data = await TransactionEntities.getTransactionEntities();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
