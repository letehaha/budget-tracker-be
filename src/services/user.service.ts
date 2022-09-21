/* eslint-disable no-useless-catch */
import { Transaction } from 'sequelize/types';
import { ACCOUNT_TYPES } from 'shared-types';

import { connection } from '@models/index';
import { ValidationError } from '@js/errors'
import * as Users from '@models/Users.model';
import * as Transactions from '@models/Transactions.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as Currencies from '@models/Currencies.model';
import * as Accounts from '@models/Accounts.model';

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
  { transaction }: { transaction?: Transaction } = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;

  transaction = transaction ?? await connection.sequelize.transaction();

  try {
    if (!currencies.length) {
      throw new ValidationError({ message: 'Currencies list is empty' });
    }

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

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};

export const editUserCurrency = async (
  {
    userId,
    currencyId,
    exchangeRate,
    liveRateUpdate,
  }: {
    userId: number;
    currencyId: number;
    exchangeRate?: number;
    liveRateUpdate?: boolean;
  },
) => {
  const transaction: Transaction = await connection.sequelize.transaction();

  try {
    const passedCurrency = await UsersCurrencies.getCurrency(
      { userId, currencyId },
      { transaction },
    );

    if (!passedCurrency) {
      throw new ValidationError({
        message: `Currency with id "${currencyId}" does not exist.`,
      });
    }

    const result = await UsersCurrencies.updateCurrency({
      userId,
      currencyId,
      exchangeRate,
      liveRateUpdate,
    }, { transaction });

    await transaction.commit();

    return result;
  } catch (err) {
    await transaction.rollback();

    throw err;
  }
};

export const setDefaultUserCurrency = async (
  {
    userId,
    currencyId,
  }: {
    userId: number;
    currencyId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;

  transaction = transaction ?? await connection.sequelize.transaction();

  try {
    const passedCurrency = await UsersCurrencies.getCurrency(
      { userId, currencyId },
      { transaction },
    );

    if (!passedCurrency) {
      throw new ValidationError({
        message: `Currency with id "${currencyId}" does not exist.`,
      });
    }

    // Make all curerncies not default
    await UsersCurrencies.updateCurrencies({
      userId,
      isDefaultCurrency: false,
    }, { transaction });

    const result = await UsersCurrencies.updateCurrency({
      userId,
      currencyId,
      isDefaultCurrency: true,
    }, { transaction });

    const currency = await Currencies.getCurrency({ id: currencyId })

    await Transactions.updateTransactions(
      {
        refCurrencyCode: currency.code,
      },
      { authorId: userId, accountType: ACCOUNT_TYPES.system },
      { transaction },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};

export const deleteUserCurrency = async (
  {
    userId,
    currencyId,
  }: {
    userId: number;
    currencyId: number;
  },
) => {
  const transaction: Transaction = await connection.sequelize.transaction();

  try {
    const passedCurrency = await UsersCurrencies.getCurrency(
      { userId, currencyId },
      { transaction },
    );

    if (!passedCurrency) {
      throw new ValidationError({
        message: `Currency with id "${currencyId}" does not exist.`,
      });
    }

    if (passedCurrency.isDefaultCurrency) {
      throw new ValidationError({
        message: 'It is not allowed to delete default currency. Unmake it default first.',
      });
    }

    const accounts = await Accounts.getAccountsByCurrency(
      { userId, currencyId },
      { transaction },
    );

    if (accounts.length) {
      throw new ValidationError({
        message: `
          It is not allowed to delete currency associated with any accounts. Delete accounts first.
          Accounts names: "${accounts.map(item => item.name)}".
        `,
        details: {
          accounts,
        },
      });
    }

    const defaultCurrency = await UsersCurrencies.getCurrency(
      { userId, isDefaultCurrency: true },
      { transaction },
    );

    await Transactions.updateTransactions(
      {
        currencyId: defaultCurrency.currencyId,
      },
      { authorId: userId, currencyId: passedCurrency.currencyId },
      { transaction },
    );

    await UsersCurrencies.deleteCurrency({
      userId,
      currencyId,
    }, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();

    throw err;
  }
};
