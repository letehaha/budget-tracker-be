import cc from 'currency-codes';
import { Transaction } from 'sequelize/types';
import { Op } from 'sequelize';
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
import { ValidationError } from '@js/errors';

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

export async function getCurrencies(
  {
    ids,
    currencies,
    numbers,
    codes,
  }: {
    ids?: number[];
    numbers?: number[];
    currencies?: string[];
    codes?: string[]
  },
  { transaction }: { transaction?: Transaction } = {},
) {
  if (ids === undefined && currencies === undefined && codes === undefined && numbers === undefined) {
    throw new ValidationError({ message: 'Neither "ids", "currencies" or "codes" should be specified.' })
  }
  const where: Record<string, unknown> = {};

  if (ids) where.id = { [Op.in]: ids }
  if (currencies) where.currency = { [Op.in]: currencies }
  if (codes) where.code = { [Op.in]: codes }
  if (numbers) where.number = { [Op.in]: numbers }

  return Currencies.findAll({ where, transaction });
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
