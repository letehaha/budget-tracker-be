import {
  Table,
  Column,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
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
