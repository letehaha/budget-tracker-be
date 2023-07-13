import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  AfterCreate,
} from 'sequelize-typescript';
import { GenericSequelizeModelAttributes } from '@common/types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import AccountTypes from '@models/AccountTypes.model';
import Balances from '@models/Balances.model';

@Table({
  timestamps: false,
})
export default class Accounts extends Model {
  @BelongsTo(
    () => Currencies,
    {
      as: 'currency',
      foreignKey: 'currencyId',
    }
  )

  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  name: string;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  currentBalance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  refCurrentBalance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  creditLimit: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  refCreditLimit: number;

  @Column({
    allowNull: false,
    defaultValue: false,
  })
  internal: boolean;

  @ForeignKey(() => AccountTypes)
  @Column
  accountTypeId: number;

  @ForeignKey(() => Currencies)
  @Column
  currencyId: number;

  @ForeignKey(() => Users)
  @Column
  userId: number;

  @AfterCreate
  static async updateAccountBalanceAfterCreate(instance: Accounts, { transaction }) {
    await Balances.handleAccountCreation(instance, { transaction });
  }
}

export const getAccounts = async (
  { userId }: { userId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const accounts = await Accounts.findAll({
    where: { userId },
    raw: true,
    ...attributes,
  });

  return accounts;
};

export const getAccountById = async (
  { userId, id }: { userId: number; id: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await Accounts.findOne({ where: { userId, id }, ...attributes });

  return account;
};

export const createAccount = async (
  {
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
    internal,
  }: {
    accountTypeId: number;
    currencyId: number;
    name: string;
    currentBalance: number;
    creditLimit: number;
    userId: number;
    internal?: boolean;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const response = await Accounts.create({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
    internal: internal ?? false,
  }, attributes);

  const account = await getAccountById({
    id: response.get('id'),
    userId,
  }, attributes);

  return account;
};

export const updateAccountById = async (
  {
    id,
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    refCurrentBalance,
    creditLimit,
    userId,
  }: {
    id: number;
    accountTypeId?: number;
    currencyId?: number;
    name?: string;
    currentBalance?: number;
    refCurrentBalance?: number;
    creditLimit?: number;
    userId: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where = { id, userId };
  await Accounts.update(
    {
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      // TODO: fix
      refCurrentBalance: refCurrentBalance ?? currentBalance,
      creditLimit,
    },
    { where, ...attributes },
  );

  const account = await getAccountById(where, { ...attributes });

  return account;
};

export const deleteAccountById = (
  { id }: { id: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  return Accounts.destroy({ where: { id }, ...attributes });
};

export const getAccountCurrency = async (
  {
    userId,
    id,
  }: {
    userId: number;
    id: number;
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await Accounts.findOne({
    where: { userId, id },
    ...attributes,
    include: {
      model: Currencies,
    },
  }) as (Accounts & { currency: Currencies });

  return account;
}

export const getAccountsByCurrency = (
  { userId, currencyId }: { userId: number; currencyId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  return Accounts.findAll({
    where: { userId, currencyId },
    ...attributes,
  })
}
