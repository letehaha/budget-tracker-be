import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { AccountModel } from 'shared-types';
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

export const getAccounts = async (
  { userId }: { userId: number },
): Promise<AccountModel[]> => {
  const accounts = await Accounts.findAll({ where: { userId } });

  return accounts;
};

export const getAccountById = async ({
  userId,
  id,
}: {
  userId: number;
  id: number;
}): Promise<AccountModel> => {
  const account = await Accounts.findOne({ where: { userId, id } });

  return account;
};

export const createAccount = async ({
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
}): Promise<AccountModel> => {
  const response = await Accounts.create({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
    userId,
  });

  const account = await getAccountById({
    id: response.get('id'),
    userId,
  });

  return account;
};

export const updateAccountById = async ({
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
}): Promise<AccountModel> => {
  const where = { id, userId };
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

export const deleteAccountById = ({ id }: { id: number }): void => {
  Accounts.destroy({ where: { id } });
};
