import { Transaction } from 'sequelize/types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
import Users from './Users.model';
import Currencies from './Currencies.model';

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
  return UsersCurrencies.findAll({
    where: { userId },
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
