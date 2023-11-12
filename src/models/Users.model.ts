import { UserModel } from 'shared-types';
import {
  Table,
  Column,
  Model,
  DefaultScope,
  Scopes,
  BelongsToMany,
  Length,
} from 'sequelize-typescript';

import { GenericSequelizeModelAttributes } from '@common/types';

import UsersCurrencies from './UsersCurrencies.model';
import Currencies from './Currencies.model';

const DETAULT_TOTAL_BALANCE = 0;

@DefaultScope(() => ({
  attributes: { exclude: ['password'] },
}))
@Scopes(() => ({
  withPassword: {
    attributes: { exclude: [] },
  },
}))
@Table({
  timestamps: false,
})
export default class Users extends Model {
  @BelongsToMany(() => Currencies, {
    as: 'currencies',
    through: () => UsersCurrencies,
  })
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    unique: true,
  })
  id: number;

  @Column({
    unique: true,
    allowNull: false,
  })
  username: string;

  @Column({
    unique: true,
    allowNull: true,
  })
  email: string;

  @Column({ allowNull: true })
  firstName: string;

  @Column({ allowNull: true })
  lastName: string;

  @Column({ allowNull: true })
  middleName: string;

  @Column({ allowNull: false })
  password: string;

  @Length({ max: 2000 })
  @Column({ allowNull: true })
  avatar: string;

  @Column({
    defaultValue: DETAULT_TOTAL_BALANCE,
    allowNull: false,
  })
  totalBalance: number;

  @Column({ allowNull: true })
  defaultCategoryId: number;
}

export const getUsers = async (
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const users = await Users.findAll({ transaction: attributes.transaction });

  return users;
};

export const getUserById = async (
  { id }: { id: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<UserModel> => {
  const user = await Users.findOne({
    where: { id },
    transaction: attributes.transaction,
  });

  return user;
};

export const getUserDefaultCategory = async (
  { id }: { id: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const user = await Users.findOne({
    where: { id },
    attributes: ['defaultCategoryId'],
    transaction: attributes.transaction,
  });

  return user;
};

export const getUserCurrencies = async (
  { userId },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const user = await Users.findOne({
    where: { id: userId },
    include: [
      {
        model: Currencies,
        as: 'currencies',
        // to remove the rows from the join table (i.e. 'UsersCurrencies' table) in the result set
        through: { attributes: [] },
      },
    ],
    transaction: attributes.transaction,
  });

  return user;
};

export const getUserByCredentials = async (
  { username, email }: { username?: string; email?: string },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<UserModel> => {
  const where: Record<string, unknown> = {};

  if (username) where.username = username;
  if (email) where.email = email;

  const user = await Users.scope('withPassword').findOne({
    where,
    transaction: attributes.transaction,
  });

  return user;
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
    totalBalance = DETAULT_TOTAL_BALANCE,
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
  attributes: GenericSequelizeModelAttributes = {},
): Promise<UserModel> => {
  const user = await Users.create(
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
    {
      transaction: attributes.transaction,
    },
  );

  return user;
};

export const updateUserById = async (
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
    password?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    avatar?: string;
    totalBalance?: number;
    defaultCategoryId?: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<UserModel> => {
  const where = { id };
  const updateFields: Record<string, unknown> = {};

  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (firstName) updateFields.firstName = firstName;
  if (lastName) updateFields.lastName = lastName;
  if (middleName) updateFields.middleName = middleName;
  if (avatar) updateFields.avatar = avatar;
  if (password) updateFields.password = password;
  if (totalBalance) updateFields.totalBalance = totalBalance;
  if (defaultCategoryId) updateFields.defaultCategoryId = defaultCategoryId;

  await Users.update(updateFields, {
    where,
    transaction: attributes.transaction,
  });

  const user = await Users.findOne({
    where,
    transaction: attributes.transaction,
  });

  return user;
};

export const deleteUserById = (
  { id },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  Users.destroy({ where: { id }, transaction: attributes.transaction });
};
