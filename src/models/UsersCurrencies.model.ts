import { Transaction } from 'sequelize/types';
import { Op, QueryTypes } from 'sequelize';
import {
  Table,
  Column,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
import { connection } from '@models/index';
import Users from './Users.model';
import Currencies from './Currencies.model';
import { ValidationError } from '@js/errors';

@Table({
  timestamps: false,
})
export default class UsersCurrencies extends Model {
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
  // TODO: check if it is possible to use findAll
  return connection.sequelize
    .query(
      `SELECT * FROM "UsersCurrencies"
      INNER JOIN "Currencies" ON "UsersCurrencies"."currencyId" = "Currencies"."id"
      WHERE "userId"=${userId}`,
      { type: QueryTypes.SELECT, transaction },
    );
};

export const getCurrency = (
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
  if (currencyId === undefined && isDefaultCurrency === undefined) {
    throw new ValidationError({ message: 'Neither "currencyId" or "isDefaultCurrency" should be specified.' })
  }

  const where: Record<string, unknown> = { userId }

  if (currencyId) where.currencyId = currencyId
  if (isDefaultCurrency) where.isDefaultCurrency = isDefaultCurrency

  return UsersCurrencies.findOne({
    where,
    transaction,
  });
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
