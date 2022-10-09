import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import AccountTypes from '@models/AccountTypes.model';

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
}

export const getAccounts = async (
  { userId }: { userId: number },
  { transaction }: { transaction?: Transaction } = {}
) => {
  const accounts = await Accounts.findAll({ where: { userId }, transaction });

  return accounts;
};

export const getAccountById = async (
  { userId, id }: { userId: number; id: number },
  { transaction }: { transaction?: Transaction } = {}
) => {
  const account = await Accounts.findOne({ where: { userId, id }, transaction });

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
  { transaction }: { transaction?: Transaction } = {}
) => {
  const response = await Accounts.create({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
    internal: internal ?? false,
  }, { transaction });

  const account = await getAccountById({
    id: response.get('id'),
    userId,
  }, { transaction });

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
  { transaction }: { transaction?: Transaction } = {},
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
    { where, transaction },
  );

  const account = await getAccountById(where, { transaction });

  return account;
};

export const deleteAccountById = (
  { id }: { id: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Accounts.destroy({ where: { id }, transaction });
};

export const getAccountCurrency = async (
  {
    userId,
    id,
  }: {
    userId: number;
    id: number;
  },
  { transaction }: { transaction?: Transaction } = {}
) => {
  const account = await Accounts.findOne({
    where: { userId, id },
    transaction,
    include: {
      model: Currencies,
    },
  }) as (Accounts & { currency: Currencies });

  return account;
}

export const getAccountsByCurrency = (
  { userId, currencyId }: { userId: number; currencyId: number },
  { transaction }: { transaction?: Transaction } = {}
) => {
  return Accounts.findAll({
    where: { userId, currencyId },
    transaction,
  })
}
