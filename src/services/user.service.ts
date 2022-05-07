/* eslint-disable no-useless-catch */
import * as Users from '@models/Users.model';

export const getUser = async (id: number) => {
  try {
    const user = await Users.getUserById({ id });

    return user
  } catch (err) {
    throw err
  }
};

export const getUserCurrencies = async (
  {
    userId,
    includeUser,
  }:
  {
    userId: number;
    includeUser?: boolean;
  },
) => {
  try {
    const user = await Users.getUserCurrencies({ userId });
    const result = includeUser === undefined ? user.get('currencies') : user;

    return result;
  } catch (err) {
    throw err
  }
};

export const updateUser = async (
  {
    id,
    username,
    email,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  }: {
    id: number;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    password?: string;
    avatar?: string;
    totalBalance?: number;
  }
) => {
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

    return user
  } catch (err) {
    throw err
  }
};

export const deleteUser = async (id: number) => {
  try {
    await Users.deleteUserById({ id });
  } catch (err) {
    throw err
  }
};
