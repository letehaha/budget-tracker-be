import {
  ACCOUNT_TYPES,
  PAYMENT_TYPES,
  TRANSACTION_TYPES,
  ExternalMonobankTransactionResponse,
} from 'shared-types';
import { Op } from 'sequelize';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
import { GenericSequelizeModelAttributes } from '@common/types';
import Users from '@models/Users.model';
import Currencies from '@models/Currencies.model';
import Categories from '@models/Categories.model';
import MonobankAccounts from './Accounts.model';

import { isExist } from '@js/helpers';

import { logger} from '@js/utils/logger';

interface TxIncludeOptions {
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
}

type MonoTxOriginalId = ExternalMonobankTransactionResponse['id']

const prepareTXInclude = (
  {
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: TxIncludeOptions,
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
  originalId: MonoTxOriginalId;

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

export interface GetTransactionsPayload extends TxIncludeOptions {
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
}
export const getTransactions = async (
  { systemUserId, sortDirection, from, limit, isRaw = false, ...includeOptions }: GetTransactionsPayload,
  attributes: GenericSequelizeModelAttributes = {}
) => {
  const include = prepareTXInclude(includeOptions);

  const transactions = await MonobankTransactions.findAll({
    ...attributes,
    include,
    where: { userId: systemUserId },
    limit,
    offset: from,
    order: [['time', sortDirection.toUpperCase()]],
    raw: isRaw,
  });

  return transactions;
};

export const getTransactionsByArrayOfField = async (
  { fieldValues, fieldName, systemUserId, isRaw = false, ...includeOptions }:
  {
    fieldValues: unknown,
    fieldName: keyof ExternalMonobankTransactionResponse,
    systemUserId: number,
    isRaw?: boolean,
  } & TxIncludeOptions
) => {
  const include = prepareTXInclude(includeOptions);

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

export const getTransactionById = async (
  { id, ...includeOptions }: { id: number } & TxIncludeOptions,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const include = prepareTXInclude(includeOptions);

  const transactions = await MonobankTransactions.findOne({ ...attributes, where: { id }, include });

  return transactions;
};

export interface GetTransactionByOriginalIdPayload extends TxIncludeOptions {
  originalId: MonoTxOriginalId;
  userId: number;
}
export const getTransactionByOriginalId = async (
  { originalId, userId, ...includeOptions }: GetTransactionByOriginalIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where: {
    originalId: MonoTxOriginalId;
    userId?: number;
  } = { originalId };

  if (userId) where.userId = userId;

  const include = prepareTXInclude(includeOptions);

  const transactions = await MonobankTransactions.findOne({
    ...attributes,
    where,
    include,
  });

  return transactions;
};

type CreateTxParamsFromMono = Pick<
  ExternalMonobankTransactionResponse,
  'amount' | 'description' | 'operationAmount' | 'commissionRate' | 'cashbackAmount' | 'balance' | 'hold' | 'receiptId'
>

export interface CreateTransactionPayload extends CreateTxParamsFromMono {
  originalId: MonoTxOriginalId;
  time: Date,
  userId: MonobankTransactions['userId'];
  transactionType: MonobankTransactions['transactionType'];
  paymentType: MonobankTransactions['paymentType'];
  monoAccountId: MonobankTransactions['monoAccountId'];
  categoryId: MonobankTransactions['categoryId'];
  currencyId: MonobankTransactions['currencyId'];
}
export const createTransaction = async (
  { originalId, userId, ...payload }: CreateTransactionPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const tx = await getTransactionByOriginalId({ originalId, userId });

  if (tx) {
    logger.error('Transaction with such id already exist!');
    return undefined;
  }

  const result = await MonobankTransactions.create({
    ...payload,
    originalId,
    userId,
    accountType: ACCOUNT_TYPES.monobank,
  }, attributes);

  const transaction = await getTransactionById(
    { id: result.get('id') },
    { transaction: attributes.transaction },
  );

  return transaction;
};

type UpdateTxParamsFromMono = Partial<Pick<
  ExternalMonobankTransactionResponse,
  'amount' | 'description' | 'time' | 'operationAmount' | 'commissionRate' | 'cashbackAmount' | 'balance' | 'hold' | 'receiptId'
>>

export interface UpdateTransactionByIdPayload extends UpdateTxParamsFromMono {
  id: number;
  userId: number;

  transactionType?: TRANSACTION_TYPES;
  paymentType?: PAYMENT_TYPES;
  monoAccountId?: number;
  categoryId?: number;
  currencyId?: number;
  note?: string;
}
export const updateTransactionById = async (
  { id, userId, ...payload }: UpdateTransactionByIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where = { id, userId };

  await MonobankTransactions.update(
    { userId, ...payload },
    { ...attributes, where },
  );

  const transaction = await getTransactionById(
    { id },
    { transaction: attributes.transaction },
  );

  return transaction;
};

export interface DeleteTransactionByIdPayload {
  id: number;
}
export const deleteTransactionById = (
  { id }: DeleteTransactionByIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => MonobankTransactions.destroy({ ...attributes, where: { id } });
