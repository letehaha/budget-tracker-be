/* eslint-disable no-useless-catch */
import { Transaction } from 'sequelize/types';

import { connection } from '@models/index';
import { ValidationError } from '@js/errors'
import * as Users from '@models/Users.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';

export const getUser = async (id: number) => {
  try {
    const user = await Users.getUserById({ id });

    return user;
  } catch (err) {
    throw err;
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
    totalBalance?: number;
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

    return user;
  } catch (err) {
    throw err;
  }
};

export const getUserByCredentials = async ({
  username,
  email,
}: {
  username?: string;
  email?: string;
}) => {
  try {
    const user = await Users.getUserByCredentials({ username, email });

    return user;
  } catch (err) {
    throw err;
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
      { transaction },
    );

    return user;
  } catch (err) {
    throw err;
  }
};

export const deleteUser = async (id: number) => {
  try {
    await Users.deleteUserById({ id });
  } catch (err) {
    throw err;
  }
};

export const getUserCurrencies = async ({ userId }: { userId: number }) => {
  try {
    const list = await UsersCurrencies.getCurrencies({ userId });

    return list;
  } catch (err) {
    throw err;
  }
};

export const addUserCurrencies = async (
  currencies: {
    userId: number;
    currencyId: number;
    exchangeRate?: number;
    liveRateUpdate?: boolean;
  }[],
) => {
  const transaction: Transaction = await connection.sequelize.transaction();

  try {
    const existingCurrencies = await UsersCurrencies.getCurrencies({ userId: currencies[0].userId });
    const duplicatedCurrencies = [];

    existingCurrencies.forEach(item => {
      const duplicated = currencies.find(currency => currency.currencyId === item.currencyId);

      if (duplicated) duplicatedCurrencies.push(duplicated)
    });

    if (duplicatedCurrencies.length) {
      throw new ValidationError({
        message: `Duplicated currencies. Ids: [${duplicatedCurrencies.map(i => i.currencyId)}]`,
      });
    }

    const result = await Promise.all(
      currencies.map(item => UsersCurrencies.addCurrency(item, { transaction }))
    );

    await transaction.commit();

    return result;
  } catch (err) {
    await transaction.rollback();

    throw err;
  }
};
