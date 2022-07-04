import cc from 'currency-codes';
import { Transaction } from 'sequelize/types';
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

export async function getCurrency({ id }: { id: number })
export async function getCurrency({ currency }: { currency: string })
export async function getCurrency({ number }: { number: number })
export async function getCurrency({ code }: { code: string })
export async function getCurrency(
  { id, currency, number, code }:
  { id?: number; currency?: string; digits?: number; number?: number; code?: string },
  { transaction }: { transaction?: Transaction } = {},
) {
  const currencies = await Currencies.findOne({ where: { id, currency, number, code }, transaction });

  return currencies;
}

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
