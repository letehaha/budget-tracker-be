import {
  ACCOUNT_TYPES,
  PAYMENT_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_TRANSFER_NATURE,
  SORT_DIRECTIONS,
  TransactionModel,
} from 'shared-types';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import {
  Table,
  BeforeCreate,
  AfterCreate,
  AfterUpdate,
  BeforeDestroy,
  BeforeUpdate,
  Column,
  Model,
  Length,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import { isExist, removeUndefinedKeys } from '@js/helpers';
import { ValidationError } from '@js/errors';
import { updateAccountBalanceForChangedTx } from '@services/accounts.service';
import Users from '@models/Users.model';
import Accounts from '@models/Accounts.model';
import Categories from '@models/Categories.model';
import Currencies from '@models/Currencies.model';
import Balances from '@models/Balances.model';
import { GenericSequelizeModelAttributes } from '@common/types';

// TODO: replace with scopes
const prepareTXInclude = ({
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
}) => {
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

export interface TransactionsAttributes {
  id: number;
  amount: number;
  // Amount in currency of base currency
  refAmount: number;
  note: string;
  time: Date;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  currencyId: number;
  currencyCode: string;
  accountType: ACCOUNT_TYPES;
  refCurrencyCode: string;

  // is transaction transfer?
  transferNature: TRANSACTION_TRANSFER_NATURE;
  // (hash, used to connect two transactions, to easily search the opposite tx)
  transferId: string;

  originalId: string; // Stores the original id from external source
  // JSON of any addition fields
  externalData: {
    operationAmount?: number;
    balance?: number;
    hold?: boolean;
    receiptId?: string;
  };
  commissionRate: number; // should be comission calculated as refAmount
  refCommissionRate: number; // should be comission calculated as refAmount
  cashbackAmount: number; // add to unified
}

@Table({
  timestamps: false,
})
export default class Transactions extends Model<TransactionsAttributes> {
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
  userId: number;

  @Column({ allowNull: false, defaultValue: TRANSACTION_TYPES.income })
  transactionType: TRANSACTION_TYPES;

  @Column({ allowNull: false, defaultValue: PAYMENT_TYPES.creditCard })
  paymentType: PAYMENT_TYPES;

  @ForeignKey(() => Accounts)
  @Column({ allowNull: false })
  accountId: number;

  @BelongsTo(() => Accounts)
  account: Accounts;

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

  @Column({
    type: DataType.ENUM(...Object.values(TRANSACTION_TRANSFER_NATURE)),
    allowNull: false,
    defaultValue: TRANSACTION_TRANSFER_NATURE.not_transfer,
  })
  transferNature: TRANSACTION_TRANSFER_NATURE;

  // (hash, used to connect two transactions)
  @Column({ allowNull: true, defaultValue: null })
  transferId: string;

  // Stores the original id from external source
  @Column({
    allowNull: true,
    type: DataType.STRING,
  })
  originalId: string;

  // Stores the original id from external source
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  externalData: object;

  // Stores the original id from external source
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  commissionRate: number;

  // Stores the original id from external source
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  refCommissionRate: number;

  // Stores the original id from external source
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  cashbackAmount: number;

  // User should set all of requiredFields for transfer transaction
  @BeforeCreate
  @BeforeUpdate
  static validateTransferRelatedFields(instance: Transactions) {
    const { transferNature, transferId, refAmount, refCurrencyCode } = instance;

    const requiredFields = [transferId, refCurrencyCode, refAmount];

    if (transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer) {
      if (requiredFields.some((item) => item === undefined)) {
        throw new ValidationError({
          message: `All these fields should be passed (${requiredFields}) for transfer transaction.`,
        });
      }
    }
  }

  @AfterCreate
  static async updateAccountBalanceAfterCreate(instance: Transactions, { transaction }) {
    const { accountType, accountId, userId, currencyId, refAmount, amount, transactionType } =
      instance;

    if (accountType === ACCOUNT_TYPES.system) {
      await updateAccountBalanceForChangedTx(
        {
          userId,
          accountId,
          amount,
          refAmount,
          transactionType,
          currencyId,
        },
        { transaction },
      );
    }

    await Balances.handleTransactionChange({ data: instance }, { transaction });
  }

  @AfterUpdate
  static async updateAccountBalanceAfterUpdate(instance: Transactions, { transaction }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newData: Transactions = (instance as any).dataValues;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevData: Transactions = (instance as any)._previousDataValues;
    const isAccountChanged = newData.accountId !== prevData.accountId;

    if (newData.accountType === ACCOUNT_TYPES.system) {
      if (isAccountChanged) {
        // Update old tx
        await updateAccountBalanceForChangedTx(
          {
            userId: prevData.userId,
            accountId: prevData.accountId,
            prevAmount: prevData.amount,
            prevRefAmount: prevData.refAmount,
            transactionType: prevData.transactionType,
            currencyId: prevData.currencyId,
          },
          { transaction },
        );

        // Update new tx
        await updateAccountBalanceForChangedTx(
          {
            userId: newData.userId,
            accountId: newData.accountId,
            amount: newData.amount,
            refAmount: newData.refAmount,
            transactionType: newData.transactionType,
            currencyId: newData.currencyId,
          },
          { transaction },
        );
      } else {
        await updateAccountBalanceForChangedTx(
          {
            userId: newData.userId,
            accountId: newData.accountId,
            amount: newData.amount,
            prevAmount: prevData.amount,
            refAmount: newData.refAmount,
            prevRefAmount: prevData.refAmount,
            transactionType: newData.transactionType,
            prevTransactionType: prevData.transactionType,
            currencyId: newData.currencyId,
          },
          { transaction },
        );
      }
    }

    const originalData = {
      accountId: prevData.accountId,
      amount: prevData.amount,
      refAmount: prevData.refAmount,
      time: prevData.time,
      transactionType: prevData.transactionType,
      currencyId: prevData.currencyId,
    } as Transactions;

    await Balances.handleTransactionChange(
      { data: newData, prevData: originalData },
      { transaction },
    );
  }

  @BeforeDestroy
  static async updateAccountBalanceBeforeDestroy(instance: Transactions, { transaction }) {
    const { accountType, accountId, userId, currencyId, refAmount, amount, transactionType } =
      instance;

    if (accountType === ACCOUNT_TYPES.system) {
      await updateAccountBalanceForChangedTx(
        {
          userId,
          accountId,
          prevAmount: amount,
          prevRefAmount: refAmount,
          transactionType,
          currencyId,
        },
        { transaction },
      );
    }

    await Balances.handleTransactionChange({ data: instance, isDelete: true }, { transaction });
  }
}

export const getTransactions = async (
  {
    from = 0,
    limit = 20,
    accountType,
    accountId,
    userId,
    sortDirection = SORT_DIRECTIONS.desc,
    includeUser,
    includeAccount,
    transactionType,
    includeCategory,
    includeAll,
    nestedInclude,
    isRaw = false,
    excludeTransfer,
  }: {
    from: number;
    limit: number;
    accountType: ACCOUNT_TYPES;
    transactionType: string;
    accountId: number;
    userId: number;
    sortDirection: SORT_DIRECTIONS;
    includeUser: boolean;
    includeAccount: boolean;
    includeCategory: boolean;
    includeAll: boolean;
    nestedInclude: boolean;
    isRaw: boolean;
    excludeTransfer?: boolean;
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
    include,
    where: {
      userId,
      ...removeUndefinedKeys({
        accountType,
        accountId,
        transactionType,
        transferNature: excludeTransfer ? TRANSACTION_TRANSFER_NATURE.not_transfer : undefined,
      }),
    },
    transaction,
    offset: from,
    limit: limit,
    order: [['time', sortDirection]],
    raw: isRaw,
  });

  return transactions;
};

export interface GetTransactionBySomeIdPayload {
  userId: TransactionsAttributes['userId'];
  id?: TransactionsAttributes['id'];
  transferId?: TransactionsAttributes['transferId'];
  originalId?: TransactionsAttributes['originalId'];
}
export const getTransactionBySomeId = (
  { userId, id, transferId, originalId }: GetTransactionBySomeIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  return Transactions.findOne({
    where: {
      userId,
      ...removeUndefinedKeys({ id, transferId, originalId }),
    },
    transaction: attributes.transaction,
  });
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
): Promise<Transactions | null> => {
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

export const getTransactionsByTransferId = (
  {
    transferId,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    transferId: number;
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

  return Transactions.findAll({
    where: { transferId, userId },
    include,
    transaction,
  });
};

export const getTransactionsByArrayOfField = async <T extends keyof TransactionModel>(
  {
    fieldValues,
    fieldName,
    userId,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }: {
    fieldValues: TransactionModel[T][];
    fieldName: T;
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

type CreateTxRequiredParams = Pick<
  TransactionsAttributes,
  | 'amount'
  | 'refAmount'
  | 'time'
  | 'userId'
  | 'transactionType'
  | 'paymentType'
  | 'accountId'
  | 'categoryId'
  | 'currencyId'
  | 'currencyCode'
  | 'accountType'
  | 'transferNature'
>;
type CreateTxOptionalParams = Partial<
  Pick<
    TransactionsAttributes,
    | 'note'
    | 'refCurrencyCode'
    | 'transferId'
    | 'originalId'
    | 'externalData'
    | 'commissionRate'
    | 'refCommissionRate'
    | 'cashbackAmount'
  >
>;

export type CreateTransactionPayload = CreateTxRequiredParams & CreateTxOptionalParams;

export const createTransaction = async (
  { userId, ...rest }: CreateTransactionPayload,
  { transaction }: { transaction?: Transaction } = {},
) => {
  const response = await Transactions.create({ userId, ...rest }, { transaction });

  return getTransactionById(
    {
      id: response.get('id'),
      userId,
    },
    { transaction },
  );
};

export interface UpdateTransactionByIdParams {
  id: number;
  userId: number;
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
  transferNature?: TRANSACTION_TRANSFER_NATURE;
  transferId?: string;
}

export const updateTransactionById = async (
  { id, userId, ...payload }: UpdateTransactionByIdParams,
  { transaction }: { transaction?: Transaction } = {},
) => {
  const where = { id, userId };

  await Transactions.update(removeUndefinedKeys(payload), {
    where,
    transaction,
    individualHooks: true,
  });

  return getTransactionById({ id, userId }, { transaction });
};

export const updateTransactions = (
  payload: {
    amount?: number;
    note?: string;
    time?: Date;
    transactionType?: TRANSACTION_TYPES;
    paymentType?: PAYMENT_TYPES;
    accountId?: number;
    categoryId?: number;
    accountType?: ACCOUNT_TYPES;
    currencyId?: number;
    refCurrencyCode?: string;
  },
  where: Record<string, unknown> & { userId: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Transactions.update(removeUndefinedKeys(payload), {
    where,
    transaction,
    individualHooks: true,
  });
};

export const deleteTransactionById = async (
  { id, userId }: { id: number; userId: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const tx = await getTransactionById({ id, userId }, { transaction });

  if (tx.accountType !== ACCOUNT_TYPES.system) {
    throw new ValidationError({
      message: "It's not allowed to manually delete external transactions",
    });
  }

  return Transactions.destroy({
    where: { id, userId },
    transaction,
    // So that BeforeDestroy will be triggered
    individualHooks: true,
  });
};
