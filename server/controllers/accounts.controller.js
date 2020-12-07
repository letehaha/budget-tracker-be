const { Accounts } = require('@models');

exports.getAccounts = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const accounts = await Accounts.getAccounts({ userId });

    return res.status(200).json({ response: accounts });
  } catch (err) {
    return next(err);
  }
};

exports.getAccountById = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const accounts = await Accounts.getAccountById({ userId, id });

    return res.status(200).json({ response: accounts });
  } catch (err) {
    return next(err);
  }
};

exports.createAccount = async (req, res, next) => {
  const {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
  } = req.body;

  try {
    const data = await Accounts.createAccount({
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(err);
  }
};

exports.updateAccount = async (req, res, next) => {
  const { id } = req.params;
  const {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
  } = req.body;

  try {
    const data = await Accounts.updateAccountById({
      id,
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    await Accounts.deleteAccountById({ id });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(err);
  }
};
