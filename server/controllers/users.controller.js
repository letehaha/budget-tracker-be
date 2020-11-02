const { Users } = require('@models');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await Users.getUsers();

    return res.status(200).json({ response: users });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await Users.getUserById({ id });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createUser = async (req, res, next) => {
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
    const user = await Users.createUser({
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

exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
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
  const { id } = req.params;

  try {
    await Users.deleteUserById({ id });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
