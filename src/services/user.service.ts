/* eslint-disable no-useless-catch */
import { Transaction } from 'sequelize/types';

import * as Users from '@models/Users.model';

export const getUser = async (id: number) => {
  try {
    const user = await Users.getUserById({ id });

    return user
  } catch (err) {
    throw err
  }
};

export const createUser = async (
  {
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
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    password: string;
    avatar?: string;
    totalBalance?: number,
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  try {
    const user = await Users.createUser(
      {
        username,
        email,
        firstName,
        lastName,
        middleName,
        password,
        avatar,
        totalBalance,
      },
      { transaction },
    );

    return user
  } catch (err) {
    throw err
  }
}

export const getUserByCredentials = async ({
  username,
  email,
}: {
  username?: string;
  email?: string;
}) => {
  try {
    const user = await Users.getUserByCredentials({ username, email });

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
    defaultCategoryId,
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
    defaultCategoryId?: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  try {
    const user = await Users.updateUserById(
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
        defaultCategoryId,
      },
      { transaction }
    );

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
