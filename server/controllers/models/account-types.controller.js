const AccountType = require('@models/AccountType');

exports.getAccountTypes = async (req, res, next) => {
  try {
    const data = await AccountType.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
