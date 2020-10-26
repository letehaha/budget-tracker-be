const TransactionType = require('@models/TransactionType');

exports.getTransactionTypes = async (req, res, next) => {
  try {
    const data = await TransactionType.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
