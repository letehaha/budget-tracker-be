import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import { AccountModel } from 'shared-types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import AccountTypes from '@models/AccountTypes.model';

@Table({
  timestamps: false,
})
export default class Accounts extends Model {
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
  creditLimit: number;

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
): Promise<AccountModel[]> => {
  const accounts = await Accounts.findAll({ where: { userId }, transaction });

  return accounts;
};

export const getAccountById = async (
  {
    userId,
    id,
  }: {
    userId: number;
    id: number;
  },
  { transaction }: { transaction?: Transaction } = {}
): Promise<AccountModel> => {
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
  }: {
    accountTypeId: number;
    currencyId: number;
    name: string;
    currentBalance: number;
    creditLimit: number;
    userId: number;
  },
  { transaction }: { transaction?: Transaction } = {}
): Promise<AccountModel> => {
  const response = await Accounts.create({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
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
    creditLimit,
    userId,
  }: {
    id: number;
    accountTypeId?: number;
    currencyId?: number;
    name?: string;
    currentBalance?: number;
    creditLimit?: number;
    userId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
): Promise<AccountModel> => {
  const where = { id, userId };
  await Accounts.update(
    {
      accountTypeId,
      currencyId,
      name,
      currentBalance,
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
