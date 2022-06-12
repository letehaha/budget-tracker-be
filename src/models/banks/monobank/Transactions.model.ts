import { ACCOUNT_TYPES, PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types';
import { Op } from 'sequelize';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
import Users from '../../Users.model';
import Currencies from '../../Currencies.model';
import Categories from '../../Categories.model';
import MonobankAccounts from './Accounts.model';

import { isExist } from '../../../js/helpers';

const prepareTXInclude = (
  {
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  },
) => {
  let include = null;

  if (isExist(includeAll)) {
    include = { all: true, nested: isExist(nestedInclude) };
  } else {
    include = [];

    if (isExist(includeUser)) include.push({ model: Users });
    if (isExist(includeAccount)) include.push({ model: MonobankAccounts });
    if (isExist(includeCategory)) include.push({ model: Categories });
  }

  return include;
};

@Table({
  timestamps: false,
})
export default class MonobankTransactions extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  originalId: string;

  @Length({ max: 2000 })
  @Column({ allowNull: true })
  description: string;

  @Column({ allowNull: false })
  amount: number;

  @Column({
    allowNull: false,
    defaultValue: Date.now(),
  })
  time: Date;

  @Column({ allowNull: false })
  operationAmount: number;

  @Column({ allowNull: false })
  commissionRate: number;

  @Column({ allowNull: false })
  cashbackAmount: number;

  @Column({ allowNull: false })
  balance: number;

  @Column({ allowNull: false })
  hold: boolean;

  @Column({ allowNull: true })
  receiptId: string;

  @Column({ allowNull: true })
  note: string;

  @ForeignKey(() => Users)
  @Column({ allowNull: false })
  userId: number;

  @ForeignKey(() => Categories)
  @Column({ allowNull: false })
  categoryId: number;

  @Column({ allowNull: false, defaultValue: TRANSACTION_TYPES.income })
  transactionType: TRANSACTION_TYPES;

  @Column({ allowNull: false, defaultValue: PAYMENT_TYPES.creditCard })
  paymentType: PAYMENT_TYPES;

  @ForeignKey(() => MonobankAccounts)
  @Column({ allowNull: false })
  monoAccountId: number;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  currencyId: number;

  @Column({ allowNull: false, defaultValue: ACCOUNT_TYPES.monobank })
  accountType: ACCOUNT_TYPES;
}

export const getTransactions = async ({
  systemUserId,
  sortDirection,
  includeUser,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
  from,
  limit,
  isRaw = false,
}: {
  systemUserId: number;
  sortDirection: string;
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
  from?: number;
  limit?: number;
  isRaw?: boolean;

}) => {
  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transactions = await MonobankTransactions.findAll({
    include,
    where: { userId: systemUserId },
    limit,
    offset: from,
    order: [['time', sortDirection.toUpperCase()]],
    raw: isRaw,
  });

  return transactions;
};

export const getTransactionsByArrayOfField = async ({
  fieldValues,
  fieldName,
  systemUserId,
  includeUser,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
  isRaw = false,
}) => {
  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transactions = await MonobankTransactions.findAll({
    where: {
      [fieldName]: {
        [Op.in]: fieldValues,
      },
      userId: systemUserId,
    },
    include,
    raw: isRaw,
  });

  return transactions;
};

export const getTransactionById = async ({
  id,
  includeUser,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
}: {
  id: number;
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
}) => {
  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transactions = await MonobankTransactions.findOne({ where: { id }, include });

  return transactions;
};

export const getTransactionByOriginalId = async ({
  originalId,
  userId,
  includeUser,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
}: {
  originalId: number;
  userId: number;
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
}) => {
  const where: {
    originalId: number;
    userId?: number;
  } = { originalId };

  if (userId) { where.userId = userId; }

  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transactions = await MonobankTransactions.findOne({
    where,
    include,
  });

  return transactions;
};

export const createTransaction = async ({
  originalId,
  description,
  amount,
  time,
  operationAmount,
  commissionRate,
  cashbackAmount,
  balance,
  hold,
  userId,
  transactionType,
  paymentType,
  monoAccountId,
  categoryId,
  receiptId,
  currencyId,
  accountType,
}: {
  originalId: number;
  description: string;
  amount: number;
  time: Date;
  operationAmount: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  hold: number;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  monoAccountId: number;
  categoryId: number;
  receiptId: number;
  currencyId: number;
  accountType: ACCOUNT_TYPES;
}) => {
  const tx = await getTransactionByOriginalId({ originalId, userId });

  if (tx) {
    console.error('Transaction with such id already exist!');
    return undefined;
  }

  const response = await MonobankTransactions.create({
    originalId,
    description,
    amount,
    time,
    operationAmount,
    commissionRate,
    cashbackAmount,
    balance,
    hold,
    userId,
    transactionType,
    paymentType,
    monoAccountId,
    categoryId,
    receiptId,
    currencyId,
    accountType,
  });

  const transaction = await getTransactionById({ id: response.get('id') });

  return transaction;
};

export const updateTransactionById = async ({
  id,
  description,
  amount,
  time,
  operationAmount,
  commissionRate,
  cashbackAmount,
  balance,
  hold,
  userId,
  transactionType,
  paymentType,
  monoAccountId,
  categoryId,
  receiptId,
  currencyId,
  note,
}: {
  userId: number;
  id: number;
  description?: string;
  amount?: number;
  time?: Date;
  operationAmount?: number;
  commissionRate?: number;
  cashbackAmount?: number;
  balance?: number;
  hold?: boolean;
  transactionType?: TRANSACTION_TYPES;
  paymentType?: PAYMENT_TYPES;
  monoAccountId?: number;
  categoryId?: number;
  receiptId?: number;
  currencyId?: number;
  note?: string;
}) => {
  const where = { id, userId };
  await MonobankTransactions.update(
    {
      description,
      amount,
      time,
      operationAmount,
      commissionRate,
      cashbackAmount,
      balance,
      hold,
      userId,
      transactionType,
      paymentType,
      monoAccountId,
      categoryId,
      receiptId,
      currencyId,
      note,
    },
    { where },
  );

  const transaction = await getTransactionById({ id });

  return transaction;
};

export const deleteTransactionById = ({ id }) => {
  MonobankTransactions.destroy({ where: { id } });
};
