const Transaction = require('@models/Transaction');

exports.getTransactions = async (req, res, next) => {
  try {
    const data = await Transaction.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
