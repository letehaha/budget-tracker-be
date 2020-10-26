const Currency = require('@models/Currency');

exports.getCurrencies = async (req, res, next) => {
  try {
    const data = await Currency.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
