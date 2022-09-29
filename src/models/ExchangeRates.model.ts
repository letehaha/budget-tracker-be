import {
  Table,
  Column,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import Currencies from './Currencies.model';

@Table({
  timestamps: true,
  createdAt: 'date',
  updatedAt: false,
})
export default class ExchangeRates extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  baseId: number;

  @Column({ allowNull: false })
  baseCode: string;

  @ForeignKey(() => Currencies)
  @Column({ allowNull: false })
  quoteId: number;

  @Column({ allowNull: false })
  quoteCode: string;

  @Column({ allowNull: true, defaultValue: 1 })
  rate: number;
}

export async function getRatesForCurrenciesPairs(
  pairs: {
    baseCode: string;
    quoteCode: string;
  }[],
  { transaction }: { transaction?: Transaction } = {},
) {
  return Promise.all(
    pairs.map(pair => (
      ExchangeRates.findOne({
        where: {
          baseCode: pair.baseCode,
          quoteCode: pair.quoteCode,
        },
        transaction,
      })
    ))
  )
}
