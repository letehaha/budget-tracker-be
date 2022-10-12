import {
  Table,
  Column,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import Currencies from './Currencies.model';
import Users from './Users.model';
import { ValidationError } from '@js/errors';

@Table({ timestamps: true })
export default class UserExchangeRates extends Model {
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

interface ExchangeRatePair {
  baseCode: string;
  quoteCode: string;
}
export async function getRates(
  { userId, pair }: { userId: number; pair: ExchangeRatePair },
  { transaction }: { transaction?: Transaction },
);
export async function getRates(
  { userId, pairs }: { userId: number; pairs: ExchangeRatePair[] },
  { transaction }: { transaction?: Transaction },
);
export async function getRates(
  {
    userId,
    pair,
    pairs,
  }: {
    userId: number;
    pair?: ExchangeRatePair,
    pairs?: ExchangeRatePair[],
  },
  { transaction }: { transaction?: Transaction } = {},
) {
  const where: Record<string|symbol, unknown> = {
    userId,
  }

  if (pair && pairs) {
    throw new ValidationError({
      message: 'Only a single parameter is allowed. Passed both "pair" and "pairs".',
    });
  }
  if (!pair && !pairs) {
    throw new ValidationError({
      message: 'One of "pair" or "pairs" parameters is required.',
    });
  }

  if (pair) {
    where.baseCode = pair.baseCode
    where.quoteCode = pair.quoteCode
  } else if (pairs) {
    where[Op.or] = pairs.map(item => ({
      [Op.and]: {
        baseCode: item.baseCode,
        quoteCode: item.quoteCode,
      }
    }))
  }

  return UserExchangeRates.findAll({
    where,
    transaction,
  })
}
