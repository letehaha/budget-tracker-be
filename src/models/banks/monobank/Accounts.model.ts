import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
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

export const createAccount = async ({
  monoUserId,
  currencyId,
  accountTypeId,
  accountId,
  balance,
  creditLimit,
  cashbackType,
  maskedPan,
  type,
  iban,
  isEnabled,
}: {
  // TODO: investigate why in `MonobankAccounts.createAccount` it is enought to
  // pass only two args src/controllers/banks/monobank.controller.ts
  monoUserId: number;
  currencyId?: number;
  accountTypeId?: number;
  accountId?: string;
  balance?: number;
  creditLimit?: number;
  cashbackType?: string;
  maskedPan?: string;
  type?: string;
  iban?: string;
  isEnabled?: boolean;
}) => {
  const account = await MonobankAccounts.create({
    accountId,
    balance,
    creditLimit,
    currencyId,
    cashbackType,
    maskedPan,
    type,
    iban,
    monoUserId,
    accountTypeId,
    isEnabled,
  });

  return account;
};

export const getAccountsByUserId = async ({
  monoUserId,
}) => {
  const accounts = await MonobankAccounts.findAll({
    where: { monoUserId },
  });

  return accounts;
};

export const getByAccountId = async ({
  accountId,
  monoUserId,
}) => {
  const account = await MonobankAccounts.findOne({
    where: { accountId, monoUserId },
  });

  return account;
};

export const getAccountsById = async ({
  accountId,
}) => {
  const account = await MonobankAccounts.findAll({
    where: { accountId },
  });

  return account;
};

export const updateById = async ({
  accountId,
  name,
  isEnabled,
  currencyCode,
  cashbackType,
  balance,
  creditLimit,
  maskedPan,
  type,
  iban,
  monoUserId,
}: {
  accountId: number;
  name?: string;
  isEnabled?: boolean;
  currencyCode?: number;
  cashbackType?: string;
  balance?: number;
  creditLimit?: number;
  maskedPan?: string;
  type?: string;
  iban?: string;
  monoUserId?: number;
}) => {
  const where: {
    accountId: number;
    monoUserId?: number;
  } = { accountId };

  if (monoUserId) {
    where.monoUserId = monoUserId;
  }

  await MonobankAccounts.update(
    {
      isEnabled,
      name,
      currencyCode,
      cashbackType,
      balance,
      creditLimit,
      maskedPan,
      type,
      iban,
    },
    { where },
  );

  const account = await MonobankAccounts.findOne({ where });

  return account;
};
