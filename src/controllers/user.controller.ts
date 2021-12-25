import * as Users from '../models/Users.model';

export const getUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await Users.getUserById({ id });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

export const getUserCurrencies = async (req, res, next) => {
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

export const updateUser = async (req, res, next) => {
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
  }: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    password: string;
    avatar: string;
    totalBalance: number;
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

export const deleteUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    await Users.deleteUserById({ id });

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
