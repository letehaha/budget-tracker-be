import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  AfterCreate,
  BeforeUpdate,
  HasMany,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { ACCOUNT_TYPES } from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import AccountTypes from '@models/AccountTypes.model';
import Balances from '@models/Balances.model';
import Transactions from '@models/Transactions.model';

export interface AccountsAttributes {
  id: number;
  name: string;
  initialBalance: number;
  refInitialBalance: number;
  currentBalance: number;
  refCurrentBalance: number;
  creditLimit: number;
  refCreditLimit: number;
  type: ACCOUNT_TYPES;
  // general, creditCard, etc. TODO: delete it
  accountTypeId: number;
  currencyId: number;
  userId: number;
  externalId: string; // represents id from the original external system if exists
  externalData: object; // JSON of any addition fields
  // cashbackType: string; // move to additionalFields that will represent non-unified data
  // maskedPan: string; // move to additionalFields
  // type: string; // move to additionalFields
  // iban: string; // move to additionalFields
  isEnabled: boolean; // represents "if account is active and should be visible in stats"
}

@Table({
  timestamps: false,
})
export default class Accounts extends Model<AccountsAttributes> {
  @BelongsTo(() => Currencies, {
    as: 'currency',
    foreignKey: 'currencyId',
  })

  @HasMany(() => Transactions)
  transactions: Transactions[];;

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
    type: DataType.INTEGER,
  })
  refInitialBalance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  currentBalance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  refCurrentBalance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  creditLimit: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  refCreditLimit: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: ACCOUNT_TYPES.system,
  })
  type: ACCOUNT_TYPES;

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
  // cashbackType: string;
  // maskedPan: string;
  // type: string;
  // iban: string;

  // represents "if account is active and should be visible in stats"
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isEnabled: boolean;

  @AfterCreate
  static async updateAccountBalanceAfterCreate(instance: Accounts, { transaction }) {
    await Balances.handleAccountChange({ account: instance }, { transaction });
  }

  @BeforeUpdate
  static async validateEditableFields(instance: Accounts) {
    console.log('instance', instance)
  }
}

export interface GetAccountsPayload {
  userId: AccountsAttributes['userId'],
  type?: AccountsAttributes['type'],
}

export const getAccounts = async (
  payload: GetAccountsPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const { userId, type } = payload;
  const where: {
    userId: AccountsAttributes['userId'];
    type?: AccountsAttributes['type'];
  } = { userId }

  if (type) where.type = type

  const accounts = await Accounts.findAll({
    where,
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

export interface GetAccountsByExternalIdsPayload {
  userId: AccountsAttributes['userId'];
  externalIds: string[];
}
export const getAccountsByExternalIds = async (
  { userId, externalIds }: GetAccountsByExternalIdsPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  console.log('getAccountsByExternalIds', { userId, externalIds })

  const account = await Accounts.findAll({
    where: {
      userId,
      externalId: {
        [Op.in]: externalIds,
      }
    },
    ...attributes,
  });

  return account;
};

export interface CreateAccountPayload {
  externalId?: AccountsAttributes['externalId'];
  externalData?: AccountsAttributes['externalData'];
  isEnabled?: AccountsAttributes['isEnabled'];
  accountTypeId: AccountsAttributes['accountTypeId'];
  currencyId: AccountsAttributes['currencyId'];
  name: AccountsAttributes['name'];
  initialBalance: AccountsAttributes['initialBalance'];
  refInitialBalance: AccountsAttributes['refInitialBalance'];
  creditLimit: AccountsAttributes['creditLimit'];
  refCreditLimit: AccountsAttributes['refCreditLimit'];
  userId: AccountsAttributes['userId'];
  type: AccountsAttributes['type'];
}

export const createAccount = async (
  {
    userId,
    type = ACCOUNT_TYPES.system,
    isEnabled = true,
    ...rest
  }: CreateAccountPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const response = await Accounts.create({
    userId,
    type,
    isEnabled,
    currentBalance: rest.initialBalance,
    refCurrentBalance: rest.refInitialBalance,
    ...rest
  }, attributes);

  const account = await getAccountById({
    id: response.get('id'),
    userId,
  }, attributes);

  return account;
};

export interface UpdateAccountByIdPayload {
  id: AccountsAttributes['id'];
  userId: AccountsAttributes['userId'];
  externalId?: AccountsAttributes['externalId'];
  accountTypeId?: AccountsAttributes['accountTypeId'];
  // currency updating is disabled
  // currencyId?: AccountsAttributes['currencyId'];
  name?: AccountsAttributes['name'];
  initialBalance?: AccountsAttributes['initialBalance'];
  refInitialBalance?: AccountsAttributes['refInitialBalance'];
  currentBalance?: AccountsAttributes['currentBalance'];
  refCurrentBalance?: AccountsAttributes['refCurrentBalance'];
  creditLimit?: AccountsAttributes['creditLimit'];
  refCreditLimit?: AccountsAttributes['refCreditLimit'];
  isEnabled?: AccountsAttributes['isEnabled'];
}

export async function updateAccountById(
  {
    id,
    userId,
    ...payload
  }: UpdateAccountByIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) {
  const where = { id, userId };

  await Accounts.update(payload, { where, ...attributes });

  const account = await getAccountById(where, { ...attributes });

  return account;
}

export const deleteAccountById = (
  { id }: { id: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  return Accounts.destroy({ where: { id }, ...attributes });
};

export const getAccountCurrency = async (
  { userId, id }: { userId: number; id: number },
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
