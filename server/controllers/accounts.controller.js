const Account = require('@models/Account');

exports.getAccounts = async (req, res, next) => {
  try {
    const data = await Account.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
