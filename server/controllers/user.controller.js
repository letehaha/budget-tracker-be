const { Users } = require('@models');

exports.getUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await Users.getUserById({ id });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getUserCurrencies = async (req, res, next) => {
  const { id: userId } = req.user;
  const { includeUser } = req.query;

  try {
    const user = await Users.getUserCurrencies({ userId });
    const result = includeUser === undefined ? user.get('currencies') : user;

    return res.status(200).json({ response: result });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateUser = async (req, res, next) => {
  const { id } = req.user;
  const {
    username,
    email,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  } = req.body;

  try {
    const user = await Users.updateUserById({
      id,
      username,
      email,
      firstName,
      lastName,
      middleName,
      password,
      avatar,
      totalBalance,
    });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    await Users.deleteUserById({ id });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
