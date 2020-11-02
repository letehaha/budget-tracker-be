const { TransactionTypes } = require('@models');

exports.getTransactionTypes = async (req, res, next) => {
  try {
    const data = await TransactionTypes.getTransactionTypes();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
