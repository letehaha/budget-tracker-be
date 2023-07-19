import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  AfterCreate,
} from 'sequelize-typescript';
import { GenericSequelizeModelAttributes } from '@common/types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import AccountTypes from '@models/AccountTypes.model';
import Balances from '@models/Balances.model';

export interface AccountsAttributes {
  id: number; // unified
  name: string; // unified
  initialBalance: number; // unified. check by balance from first tx
  currentBalance: number; // unified
  refCurrentBalance: number; // unified
  creditLimit: number; // unified
  refCreditLimit: number; // unified
  type: 'system' | 'monobank'; // rename to "type = 'system' | 'monobank'"
  accountTypeId: number; // unified
  currencyId: number; // unified
  userId: number; // unified

  // TODO:
  externalId: string; // represents id from the original external system if exists
  externalData: object; // JSON of any addition fields
  // cashbackType: string; // move to additionalFields that will represent non-unified data
  // maskedPan: string; // move to additionalFields
  // type: string; // move to additionalFields
  // iban: string; // move to additionalFields
  isEnabled: boolean; // represents "if account is active and should be visible in stats"
  // monoUserId -> userId: number; // just use userId
}

@Table({
  timestamps: false,
})
export default class Accounts extends Model<AccountsAttributes> {
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
    type: DataType.INTEGER,
  })
  initialBalance: number;

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
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 0,
  })
  type: 'system' | 'monobank';

  @ForeignKey(() => AccountTypes)
  @Column
  accountTypeId: number;

  @ForeignKey(() => Currencies)
  @Column
  currencyId: number;

  @ForeignKey(() => Users)
  @Column
  userId: number;

  // represents id from the original external system if exists
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  externalId: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  externalData: object; // JSON of any addition fields
  // cashbackType: string; // move to additionalFields that will represent non-unified data
  // maskedPan: string; // move to additionalFields
  // type: string; // move to additionalFields
  // iban: string; // move to additionalFields

  // represents "if account is active and should be visible in stats"
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isEnabled: boolean;
  // monoUserId -> userId: number; // just use userId

  @AfterCreate
  static async updateAccountBalanceAfterCreate(instance: Accounts, { transaction }) {
    await Balances.handleAccountCreation(instance, { transaction });
  }
}

export const getAccounts = async (
  { userId }: { userId: AccountsAttributes['userId'] },
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
  { userId, id }: { userId: AccountsAttributes['userId']; id: AccountsAttributes['id'] },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await Accounts.findOne({ where: { userId, id }, ...attributes });

  return account;
};

export const createAccount = async (
  {
    userId,
    type = 'system',
    isEnabled = true,
    ...rest
  }: {
    externalId?: AccountsAttributes['externalId'];
    externalData?: AccountsAttributes['externalData'];
    isEnabled?: AccountsAttributes['isEnabled'];
    accountTypeId: AccountsAttributes['accountTypeId'];
    currencyId: AccountsAttributes['currencyId'];
    name: AccountsAttributes['name'];
    currentBalance: AccountsAttributes['currentBalance'];
    initialBalance: AccountsAttributes['initialBalance'];
    creditLimit: AccountsAttributes['creditLimit'];
    userId: AccountsAttributes['userId'];
    type?: AccountsAttributes['type'];
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const response = await Accounts.create({
    userId,
    type,
    isEnabled,
    ...rest
  }, attributes);

  const account = await getAccountById({
    id: response.get('id'),
    userId,
  }, attributes);

  return account;
};

// TODO: Do we need to allow initialBalance editing here?
export const updateAccountById = async (
  {
    id,
    userId,
    refCurrentBalance,
    currentBalance,
    ...rest
  }: {
    id: AccountsAttributes['id'];
    accountTypeId?: AccountsAttributes['accountTypeId'];
    currencyId?: AccountsAttributes['currencyId'];
    name?: AccountsAttributes['name'];
    currentBalance?: AccountsAttributes['currentBalance'];
    refCurrentBalance?: AccountsAttributes['refCurrentBalance'];
    creditLimit?: AccountsAttributes['creditLimit'];
    userId: AccountsAttributes['userId'];
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where = { id, userId };
  await Accounts.update(
    {
      currentBalance,
      // TODO: fix
      refCurrentBalance: refCurrentBalance ?? currentBalance,
      ...rest,
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
