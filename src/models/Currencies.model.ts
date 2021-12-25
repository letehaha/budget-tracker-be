import cc from 'currency-codes';
import {
  Table,
  Column,
  Model,
  AutoIncrement,
  Unique,
  AllowNull,
  PrimaryKey,
  BelongsToMany,
} from 'sequelize-typescript';
import Users from './Users.model';
import UsersCurrencies from './UsersCurrencies.model';

@Table({
  timestamps: false,
})
export default class Currencies extends Model {
  @BelongsToMany(
    () => Users,
    {
      as: 'users',
      through: () => UsersCurrencies,
    }
  )
  @Unique
  @AllowNull(false)
  @AutoIncrement
  @PrimaryKey
  @Column
  id: number;

  @AllowNull(false)
  @Column
  currency: string;

  @AllowNull(false)
  @Column
  digits: number;

  @AllowNull(false)
  @Column
  number: number;

  @AllowNull(false)
  @Column
  code: string;
}

export const getAllCurrencies = async () => {
  const currencies = await Currencies.findAll();

  return currencies;
};

export const createCurrency = async ({ code }) => {
  const currency = cc.number(code);

  const currencyData = {
    code: currency.code,
    number: Number(currency.number),
    digits: currency.digits,
    currency: currency.currency,
  };
  const [result] = await Currencies.findOrCreate({
    where: { number: code },
    defaults: currencyData,
  });

  return result;
};
