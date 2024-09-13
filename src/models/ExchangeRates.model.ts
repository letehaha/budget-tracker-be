import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { ExchangeRatesModel } from 'shared-types';
import Currencies from './Currencies.model';

interface ExchangeRatesAttributes extends ExchangeRatesModel {}

@Table({
  timestamps: true,
  createdAt: 'date',
  updatedAt: false,
})
export default class ExchangeRates extends Model<ExchangeRatesAttributes> {
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
) {
  return ExchangeRates.findAll({
    where: {
      [Op.or]: pairs.map((item) => ({
        [Op.and]: {
          baseCode: item.baseCode,
          quoteCode: item.quoteCode,
        },
      })),
    },
    raw: true,
  });
}
