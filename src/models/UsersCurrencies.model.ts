import { Transaction } from 'sequelize/types';
import { Op } from 'sequelize';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { UserCurrencyModel } from 'shared-types';
import { removeUndefinedKeys } from '@js/helpers';
import Users from './Users.model';
import Currencies from './Currencies.model';

interface UserCurrencyAttributes extends UserCurrencyModel {}
@Table({
  timestamps: false,
})
export default class UsersCurrencies extends Model<UserCurrencyAttributes> {
  @BelongsTo(
    () => Users,
    {
      as: 'user',
      foreignKey: 'userId',
    }
  )
  @BelongsTo(
    () => Currencies,
    {
      as: 'currency',
      foreignKey: 'currencyId',
    }
  )

  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Users)
  @Column({ allowNull: false })
  userId: number;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  currencyId: number;

  // Since base currency is always the same, here we're setting exchange rate
  // between currencyId to user's base currency
  @Column({
    allowNull: true,
    defaultValue: null,
  })
  exchangeRate: number;

  @Column({
    allowNull: false,
    defaultValue: false,
  })
  liveRateUpdate: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
  })
  isDefaultCurrency: boolean;
}

export const getCurrencies = (
  { userId }: { userId: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return UsersCurrencies.findAll({
    where: { userId },
    include: {
      model: Currencies,
    },
    transaction,
  });
};

export const getBaseCurrency = async (
  { userId }: { userId: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  const data = await UsersCurrencies.findOne({
    where: { userId, isDefaultCurrency: true },
    include: { model: Currencies },
    transaction,
  }) as UsersCurrencies & { currency: Currencies };

  return data;
};

type getCurrencyOverload = {
  (
    { userId, currencyId }: { userId: number; currencyId: number; },
    { transaction }: { transaction?: Transaction }
  ): Promise<UsersCurrencies & { currency: Currencies }>;
  (
    { userId, isDefaultCurrency }: { userId: number; isDefaultCurrency: boolean; },
    { transaction }: { transaction?: Transaction }
  ): Promise<UsersCurrencies & { currency: Currencies }>;
}
export const getCurrency: getCurrencyOverload = (
  {
    userId,
    currencyId,
    isDefaultCurrency,
  }: {
    userId: number;
    currencyId?: number;
    isDefaultCurrency?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return UsersCurrencies.findOne({
    where: removeUndefinedKeys({ userId, currencyId, isDefaultCurrency }),
    include: {
      model: Currencies,
    },
    transaction,
  }) as Promise<UsersCurrencies & { currency: Currencies }>;
};

export const addCurrency = (
  {
    userId,
    currencyId,
    exchangeRate,
    liveRateUpdate,
    isDefaultCurrency,
  }: {
    userId: number;
    currencyId: number;
    exchangeRate?: number;
    liveRateUpdate?: boolean;
    isDefaultCurrency?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return UsersCurrencies.create(
    {
      userId,
      currencyId,
      exchangeRate,
      liveRateUpdate,
      isDefaultCurrency,
    },
    {
      returning: true,
      transaction,
    },
  );
};

export const updateCurrency = async (
  {
    userId,
    currencyId,
    exchangeRate,
    liveRateUpdate,
    isDefaultCurrency,
  }: {
    userId: number;
    currencyId: number;
    exchangeRate?: number;
    liveRateUpdate?: boolean;
    isDefaultCurrency?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {

  const where = { userId, currencyId };

  await UsersCurrencies.update(
    {
      exchangeRate,
      liveRateUpdate,
      isDefaultCurrency,
    },
    {
      where,
      transaction,
    },
  );

  const currency = await getCurrency(where, { transaction });

  return currency;
};

export const deleteCurrency = async (
  {
    userId,
    currencyId,
  }: {
    userId: number;
    currencyId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {

  const where = { userId, currencyId };

  return UsersCurrencies.destroy({
    where,
    transaction,
  });
};

export const updateCurrencies = async (
  {
    userId,
    currencyIds,
    exchangeRate,
    liveRateUpdate,
    isDefaultCurrency,
  }: {
    userId: number;
    currencyIds?: number[];
    exchangeRate?: number;
    liveRateUpdate?: boolean;
    isDefaultCurrency?: boolean;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {

  const where: {
    userId: number;
    currencyId?: { [Op.in]: number[] };
  } = { userId };

  if (currencyIds?.length) {
    where.currencyId = {
      [Op.in]: currencyIds,
    }
  }

  await UsersCurrencies.update(
    {
      exchangeRate,
      liveRateUpdate,
      isDefaultCurrency,
    },
    {
      where,
      transaction,
    },
  );

  return UsersCurrencies.findAll({
    where,
    transaction,
  });
};
