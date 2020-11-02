const { Currencies } = require('@models');

exports.getCurrencies = async (req, res, next) => {
  try {
    const data = await Currencies.getCurrencies();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
