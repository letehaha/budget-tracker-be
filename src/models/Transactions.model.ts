import { ACCOUNT_TYPES, PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import {
  Table,
  Column,
  Model,
  Length,
  ForeignKey,
} from 'sequelize-typescript';
import { isExist } from '../js/helpers';
import Users from '@models/Users.model';
import Accounts from '@models/Accounts.model';
import Categories from '@models/Categories.model';
import Currencies from '@models/Currencies.model';

const prepareTXInclude = (
  {
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    includeUser?: boolean;
    includeAccount?: boolean;
    includeCategory?: boolean;
    includeAll?: boolean;
    nestedInclude?: boolean;
  },
) => {
  let include = null;

  if (isExist(includeAll)) {
    include = { all: true, nested: isExist(nestedInclude) };
  } else {
    include = [];

    if (isExist(includeUser)) include.push({ model: Users });
    if (isExist(includeAccount)) include.push({ model: Accounts });
    if (isExist(includeCategory)) include.push({ model: Categories });
  }

  return include;
};

@Table({
  timestamps: false,
})
export default class Transactions extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  amount: number;

  @Length({ max: 2000 })
  @Column({ allowNull: true })
  note: number;

  @Column({
    defaultValue: Date.now(),
    allowNull: false,
  })
  time: Date;

  @ForeignKey(() => Users)
  @Column
  userId: number;

  @Column({ allowNull: false, defaultValue: TRANSACTION_TYPES.income })
  transactionType: TRANSACTION_TYPES;

  @Column({ allowNull: false, defaultValue: PAYMENT_TYPES.creditCard })
  paymentType: PAYMENT_TYPES;

  @ForeignKey(() => Accounts)
  @Column
  accountId: number;

  @ForeignKey(() => Categories)
  @Column
  categoryId: number;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  currencyId: number;

  @Column({ allowNull: false, defaultValue: ACCOUNT_TYPES.system })
  accountType: ACCOUNT_TYPES;

  // Describes from which account tx was sent
  @Column({ allowNull: true, defaultValue: null })
  fromAccountId: number;

  // Describes from's account type
  @Column({ allowNull: true, defaultValue: null })
  fromAccountType: ACCOUNT_TYPES;

  // Describes to which account tx was sent
  @Column({ allowNull: true, defaultValue: null })
  toAccountId: number;

  // Describes to's account type
  @Column({ allowNull: true, defaultValue: null })
  toAccountType: ACCOUNT_TYPES;

  // Id to the opposite tx. Used for the Transfer feature
  @Column({ allowNull: true, defaultValue: null })
  oppositeId: number;
}

export const getTransactions = async ({
  userId,
  sortDirection,
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

  const transactions = await Transactions.findAll({
    include,
    where: { userId },
    order: [['time', sortDirection.toUpperCase()]],
    raw: isRaw,
  });

  return transactions;
};

export const getTransactionById = (
  {
    id,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    id: number;
    userId: number;
    includeUser?: boolean;
    includeAccount?: boolean;
    includeCategory?: boolean;
    includeAll?: boolean;
    nestedInclude?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  return Transactions.findOne({
    where: { id, userId },
    include,
    transaction,
  });
};

export const getTransactionsByArrayOfField = async (
  {
    fieldValues,
    fieldName,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }, { transaction }: { transaction?: Transaction } = {}
) => {
  const include = prepareTXInclude({
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transactions = await Transactions.findAll({
    where: {
      [fieldName]: {
        [Op.in]: fieldValues,
      },
      userId,
    },
    include,
    transaction,
  });

  return transactions;
};

export const createTransaction = async (
  {
    amount,
    note,
    time,
    userId,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    accountType,
    fromAccountId,
    fromAccountType,
    toAccountId,
    toAccountType,
    oppositeId,
    currencyId,
  }: {
    amount: number;
    note?: string;
    time: string;
    userId: number;
    transactionType: TRANSACTION_TYPES;
    paymentType: PAYMENT_TYPES;
    accountId: number;
    categoryId: number;
    fromAccountId?: number;
    fromAccountType?: ACCOUNT_TYPES;
    toAccountId?: number;
    toAccountType?: ACCOUNT_TYPES;
    oppositeId?: number;
    currencyId: number;
    accountType: ACCOUNT_TYPES;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const response = await Transactions.create({
    amount,
    note,
    time,
    userId,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    accountType,
    fromAccountId,
    fromAccountType,
    toAccountId,
    toAccountType,
    oppositeId,
    currencyId,
  }, { transaction });

  return getTransactionById(
    {
      id: response.get('id'),
      userId,
    },
    { transaction }
  );
};

export const updateTransactionById = async (
  {
    id,
    amount,
    note,
    time,
    userId,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    fromAccountId,
    fromAccountType,
    toAccountId,
    toAccountType,
    oppositeId,
    currencyId,
  }: {
    id: number;
    amount?: number;
    note?: string;
    time?: Date;
    userId: number;
    transactionType?: TRANSACTION_TYPES;
    paymentType?: PAYMENT_TYPES;
    accountId?: number;
    categoryId?: number;
    fromAccountId?: number;
    fromAccountType?: ACCOUNT_TYPES;
    toAccountId?: number;
    toAccountType?: ACCOUNT_TYPES;
    oppositeId?: number;
    accountType?: ACCOUNT_TYPES;
    currencyId?: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const where = { id, userId };
  await Transactions.update(
    {
      amount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      fromAccountId,
      fromAccountType,
      toAccountId,
      toAccountType,
      oppositeId,
      currencyId,
    },
    { where, transaction },
  );

  return getTransactionById({ id, userId }, { transaction });
};

export const deleteTransactionById = (
  {
    id,
    userId,
  }: {
    id: number;
    userId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Transactions.destroy({ where: { id, userId }, transaction });
}
