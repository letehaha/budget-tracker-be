const PaymentType = require('@models/PaymentType');

exports.getPaymentTypes = async (req, res, next) => {
  try {
    const data = await PaymentType.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
