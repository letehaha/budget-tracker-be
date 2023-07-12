import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
import { endpointsTypes } from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';
import Currencies from '../../Currencies.model';
import MonobankUsers from './Users.model';
import AccountTypes from '../../AccountTypes.model';

@Table({
  timestamps: true,
})
export default class MonobankAccounts extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  accountId: string;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  balance: number;

  @Column({
    allowNull: false,
    defaultValue: 0,
  })
  creditLimit: number;

  @Column({ allowNull: true })
  cashbackType: string;

  @Length({ max: 1000 })
  @Column({ allowNull: true })
  maskedPan: string;

  @Column({ allowNull: false })
  type: string;

  @Column({ allowNull: false })
  iban: string;

  @Column({
    allowNull: false,
    defaultValue: false,
  })
  isEnabled: boolean;

  @Column({
    allowNull: true,
    defaultValue: 'Account',
  })
  name: string;

  @ForeignKey(() => MonobankUsers)
  @Column({ allowNull: false })
  monoUserId: number;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  currencyId: number;

  @ForeignKey(() => AccountTypes)
  @Column({ allowNull: false })
  accountTypeId: number;
}

// TODO: investigate why in `MonobankAccounts.createAccount` it is enought to
// pass only two args src/controllers/banks/monobank.controller.ts
export type MonoAccountCreationPayload = {
  monoUserId: number;
  currencyId?: number;
  accountTypeId?: number;
  accountId: string;
  balance?: number;
  creditLimit?: number;
  cashbackType?: string;
  maskedPan?: string;
  type?: string;
  iban?: string;
  isEnabled?: boolean;
}

export const createAccount = async (
  payload: MonoAccountCreationPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await MonobankAccounts.create(payload, attributes);

  return account;
};

export const getAccountsByUserId = async (
  { monoUserId },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const accounts = await MonobankAccounts.findAll({
    where: { monoUserId },
    raw: true,
    ...attributes,
  });

  return accounts;
};

export const getByAccountId = async (
  { accountId, monoUserId },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await MonobankAccounts.findOne({
    ...attributes,
    raw: true,
    where: { accountId, monoUserId },
  });

  return account;
};

export const getAccountsById = async (
  { accountId },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const account = await MonobankAccounts.findAll({
    ...attributes,
    raw: true,
    where: { accountId },
  });

  return account;
};

export interface MonoAccountUpdatePayload extends endpointsTypes.UpdateMonobankAccountByIdBody {
  monoUserId: number;
}
export const updateById = async (
  { accountId, monoUserId, ...toUpdate }: MonoAccountUpdatePayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where: {
    accountId: MonoAccountUpdatePayload['accountId'];
    monoUserId?: MonoAccountUpdatePayload['monoUserId'];
  } = { accountId };

  if (monoUserId) {
    where.monoUserId = monoUserId;
  }

  await MonobankAccounts.update(toUpdate, { ...attributes, where });

  const account = await MonobankAccounts.findOne({ where, raw: true });

  return account;
};
