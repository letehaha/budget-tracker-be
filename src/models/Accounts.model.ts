import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import Users from './Users.model';
import Currencies from './Currencies.model';
import AccountTypes from './AccountTypes.model';

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

export const getAccounts = async ({ userId }) => {
  const accounts = await Accounts.findAll({ where: { userId } });

  return accounts;
};

export const getAccountById = async ({
  userId,
  id,
}: {
  userId?: string;
  id: number;
}) => {
  const account = await Accounts.findOne({ where: { userId, id } });

  return account;
};

export const createAccount = async ({
  accountTypeId,
  currencyId,
  name,
  currentBalance,
  creditLimit,
}) => {
  const response = await Accounts.create({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
  });

  const account = await getAccountById({ id: response.get('id') });

  return account;
};

export const updateAccountById = async ({
  id,
  accountTypeId,
  currencyId,
  name,
  currentBalance,
  creditLimit,
}) => {
  const where = { id };
  await Accounts.update(
    {
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    },
    { where },
  );

  const account = await getAccountById(where);

  return account;
};

export const deleteAccountById = ({ id }) => {
  Accounts.destroy({ where: { id } });
};
