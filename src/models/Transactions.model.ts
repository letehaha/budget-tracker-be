import { ACCOUNT_TYPES, PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import { ValidationError } from '@js/errors'
import {
  Table,
  BeforeCreate,
  BeforeUpdate,
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

// + id
// + accountId
// + amount
// + categoryId
// + currencyId
// + paymentType
// + note
// + time
// + transactionType: (expense, income) no "transfer" so that we can easily calculate incomes and expenses
// + authorId (userId)
// + refAmount (amount of reference used in Transfer)
// + refCurrencyCode (currencyCode of reference. used in Transfer)
// + isTransfer (boolean)
// + transferId (hash, used to connect two transactions)
// + currencyCode
// + revision (hash, maybe will be used in revisions to build statistics)

// non-system fields
// remoteCategoryName
// integrationId (not sure how to use)
// integrationOriginalTransactionId
// integrationRecipeId
// integrationTransactionTime
// integrationNote
// integrationComission
// integrationCashbackAmount
// integrationAccountId
//

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

  @Column({ allowNull: false, defaultValue: '' })
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

  // revision (hash, maybe will be used in revisions to build statistics)

  // Describes from which account tx was sent
  // @Column({ allowNull: true, defaultValue: null })
  // fromAccountId: number;

  // Describes from's account type
  // @Column({ allowNull: true, defaultValue: null })
  // fromAccountType: ACCOUNT_TYPES;

  // Describes to which account tx was sent
  // @Column({ allowNull: true, defaultValue: null })
  // toAccountId: number;

  // Describes to's account type
  // @Column({ allowNull: true, defaultValue: null })
  // toAccountType: ACCOUNT_TYPES;

  // Id to the opposite tx. Used for the Transfer feature
  // @Column({ allowNull: true, defaultValue: null })
  // oppositeId: number;

  // @BeforeCreate
  // @BeforeUpdate
  // static validateAmountAndType(instance: Transactions) {
  //   const { amount, transactionType } = instance;

  //   if (transactionType === TRANSACTION_TYPES.expense && amount > 0) {
  //     throw new ValidationError({ message: 'Expense amount cannot be positive' });
  //   }
  //   if (transactionType === TRANSACTION_TYPES.income && amount < 0) {
  //     throw new ValidationError({ message: 'Income amount cannot be negative' });
  //   }
  // }

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
    time: string;
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
  console.log('params', {
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
  })
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

  console.log(1)

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
    amount,
    note,
    time,
    authorId,
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
    time?: string;
    authorId: number;
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
  const where = { id, authorId };
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

  return getTransactionById({ id, authorId }, { transaction });
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
