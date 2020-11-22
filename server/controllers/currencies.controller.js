const { Currencies } = require('@models');

exports.getAllCurrencies = async (req, res, next) => {
  try {
    const data = await Currencies.getAllCurrencies();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
