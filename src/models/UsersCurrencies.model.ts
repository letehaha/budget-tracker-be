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
}
