import { ACCOUNT_TYPES, PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import {
  Table,
  BeforeCreate,
  BeforeUpdate,
  Column,
  Model,
  Length,
  ForeignKey,
} from 'sequelize-typescript';
import { isExist } from '@js/helpers';
import { ValidationError } from '@js/errors'
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

  @Column({ allowNull: false, defaultValue: 0 })
  amount: number;

  // Amount in curreny of account
  @Column({ allowNull: false, defaultValue: 0 })
  refAmount: number;

  @Length({ max: 2000 })
  @Column({ allowNull: true })
  note: string;

  @Column({
    defaultValue: Date.now(),
    allowNull: false,
  })
  time: Date;

  @ForeignKey(() => Users)
  @Column
  authorId: number;

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

  @Column({ allowNull: false })
  currencyCode: string;

  @Column({ allowNull: false, defaultValue: ACCOUNT_TYPES.system })
  accountType: ACCOUNT_TYPES;

  @Column({ allowNull: true, defaultValue: null })
  refCurrencyCode: string;

  // is transaction transfer?
  @Column({ allowNull: false, defaultValue: false })
  isTransfer: boolean;

  // (hash, used to connect two transactions)
  @Column({ allowNull: true, defaultValue: null })
  transferId: string;

  // User should set all of requiredFields for transfer transaction
  @BeforeCreate
  @BeforeUpdate
  static validateTransferRelatedFields(instance: Transactions) {
    const {
      isTransfer,
      transferId,
      refAmount,
      refCurrencyCode,
    } = instance;

    const requiredFields = [transferId, refCurrencyCode, refAmount]

    if (isTransfer) {
      if (requiredFields.some(item => item === undefined)) {
        throw new ValidationError({
          message: `All these fields should be passed (${requiredFields}) for transfer transaction.`,
        });
      }
    }
  }
}

export const getTransactions = async ({
  authorId,
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
    where: { authorId },
    order: [['time', sortDirection.toUpperCase()]],
    raw: isRaw,
  });

  return transactions;
};

export const getTransactionById = (
  {
    id,
    authorId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    id: number;
    authorId: number;
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
    where: { id, authorId },
    include,
    transaction,
  });
};

export const getTransactionsByTransferId = (
  {
    transferId,
    authorId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    transferId: number;
    authorId: number;
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

  return Transactions.findAll({
    where: { transferId, authorId },
    include,
    transaction,
  });
};

export const getTransactionsByArrayOfField = async (
  {
    fieldValues,
    fieldName,
    authorId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    fieldValues: unknown[];
    fieldName: string;
    authorId: number;
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

  const transactions = await Transactions.findAll({
    where: {
      [fieldName]: {
        [Op.in]: fieldValues,
      },
      authorId,
    },
    include,
    transaction,
  });

  return transactions;
};

export const createTransaction = async (
  {
    amount,
    refAmount,
    note,
    time,
    authorId,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    currencyId,
    currencyCode,
    refCurrencyCode,
    accountType,
    isTransfer,
    transferId,
  }: {
    amount: number;
    refAmount: number;
    note?: string;
    time: Date;
    authorId: number;
    transactionType: TRANSACTION_TYPES;
    paymentType: PAYMENT_TYPES;
    accountId: number;
    categoryId: number;
    currencyId: number;
    currencyCode: string;
    refCurrencyCode?: string;
    accountType: ACCOUNT_TYPES;
    isTransfer?: boolean;
    transferId?: string;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const response = await Transactions.create({
    amount,
    refAmount,
    note,
    time,
    authorId,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    accountType,
    currencyId,
    currencyCode,
    refCurrencyCode,
    isTransfer,
    transferId,
  }, { transaction });

  return getTransactionById(
    {
      id: response.get('id'),
      authorId,
    },
    { transaction }
  );
};

export const updateTransactionById = async (
  {
    id,
    authorId,
    amount,
    refAmount,
    note,
    time,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    currencyId,
    currencyCode,
    refCurrencyCode,
    isTransfer,
    transferId,
  }: {
    id: number;
    authorId: number;
    amount?: number;
    refAmount?: number;
    note?: string;
    time?: Date;
    transactionType?: TRANSACTION_TYPES;
    paymentType?: PAYMENT_TYPES;
    accountId?: number;
    categoryId?: number;
    currencyId?: number;
    currencyCode?: string;
    refCurrencyCode?: string;
    isTransfer?: boolean;
    transferId?: string;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const where = { id, authorId };
  await Transactions.update(
    {
      amount,
      refAmount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      currencyCode,
      refCurrencyCode,
      isTransfer,
      transferId,
      currencyId,
    },
    { where, transaction },
  );

  return getTransactionById({ id, authorId }, { transaction });
};

export const updateTransactions = (
  {
    amount,
    note,
    time,
    transactionType,
    paymentType,
    accountId,
    categoryId,
    currencyId,
    refCurrencyCode,
  }: {
    amount?: number;
    note?: string;
    time?: string;
    transactionType?: TRANSACTION_TYPES;
    paymentType?: PAYMENT_TYPES;
    accountId?: number;
    categoryId?: number;
    accountType?: ACCOUNT_TYPES;
    currencyId?: number;
    refCurrencyCode?: string;
  },
  where: Record<string, unknown>,
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Transactions.update(
    {
      amount,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      currencyId,
      refCurrencyCode,
    },
    { where, transaction },
  );
};

export const deleteTransactionById = (
  {
    id,
    authorId,
  }: {
    id: number;
    authorId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Transactions.destroy({ where: { id, authorId }, transaction });
}
