import { Op } from 'sequelize';
import {
  Table,
  Column,
  Model,
  Length,
  ForeignKey,
} from 'sequelize-typescript';
import { isExist } from '../js/helpers';
import Users from './Users.model';
import TransactionTypes from './TransactionTypes.model';
import PaymentTypes from './PaymentTypes.model';
import Accounts from './Accounts.model';
import Categories from './Categories.model';
import TransactionEntities from './TransactionEntities.model';

const prepareTXInclude = (
  {
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    includeUser?: boolean;
    includeTransactionType?: boolean;
    includePaymentType?: boolean;
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
    if (isExist(includeTransactionType)) {
      include.push({ model: TransactionTypes });
    }
    if (isExist(includePaymentType)) include.push({ model: PaymentTypes });
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

  @ForeignKey(() => TransactionTypes)
  @Column
  transactionTypeId: number;

  @ForeignKey(() => PaymentTypes)
  @Column
  paymentTypeId: number;

  @ForeignKey(() => Accounts)
  @Column
  accountId: number;

  @ForeignKey(() => Categories)
  @Column
  categoryId: number;

  @ForeignKey(() => TransactionEntities)
  @Column
  transactionEntityId: number;
}

export const getTransactions = async ({
  userId,
  sortDirection,
  includeUser,
  includeTransactionType,
  includePaymentType,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
  isRaw = false,
}) => {
  const include = prepareTXInclude({
    includeUser,
    includeTransactionType,
    includePaymentType,
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

export const getTransactionById = async ({
  id,
  userId,
  includeUser,
  includeTransactionType,
  includePaymentType,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
}: {
  id: number;
  userId: number;
  includeUser?: boolean;
  includeTransactionType?: boolean;
  includePaymentType?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
}) => {
  const include = prepareTXInclude({
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  });

  const transaction = await Transactions.findOne({
    where: { id, userId },
    include,
  });

  return transaction;
};

export const getTransactionsByArrayOfField = async ({
  fieldValues,
  fieldName,
  userId,
  includeUser,
  includeTransactionType,
  includePaymentType,
  includeAccount,
  includeCategory,
  includeAll,
  nestedInclude,
}) => {
  const include = prepareTXInclude({
    includeUser,
    includeTransactionType,
    includePaymentType,
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
  });

  return transactions;
};

export const createTransaction = async ({
  amount,
  note,
  time,
  userId,
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
  transactionEntityId,
}) => {
  const response = await Transactions.create({
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
    transactionEntityId,
  });

  const transaction = await getTransactionById({
    id: response.get('id'),
    userId,
  });

  return transaction;
};

export const updateTransactionById = async ({
  id,
  amount,
  note,
  time,
  userId,
  transactionTypeId,
  paymentTypeId,
  accountId,
  categoryId,
}) => {
  const where = { id };
  await Transactions.update(
    {
      amount,
      note,
      time,
      userId,
      transactionTypeId,
      paymentTypeId,
      accountId,
      categoryId,
    },
    { where },
  );

  const transaction = await getTransactionById({ id, userId });

  return transaction;
};

export const deleteTransactionById = ({ id, userId }) => {
  Transactions.destroy({ where: { id, userId } });
};
