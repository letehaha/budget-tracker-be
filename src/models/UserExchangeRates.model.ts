import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { UserExchangeRatesModel } from 'shared-types';
import Currencies, { getCurrencies } from './Currencies.model';
import Users from './Users.model';
import { ValidationError } from '@js/errors';
import { GenericSequelizeModelAttributes } from '@common/types';

type UserExchangeRatesAttributes = Omit<UserExchangeRatesModel, 'custom'>;

@Table({ timestamps: true })
export default class UserExchangeRates extends Model<UserExchangeRatesAttributes> {
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

export type ExchangeRatePair = Pick<
  UserExchangeRatesAttributes,
  'baseCode' | 'quoteCode'
>;

export async function getRates(
  {
    userId,
    pair,
  }: { userId: UserExchangeRatesAttributes['userId']; pair: ExchangeRatePair },
  attributes: GenericSequelizeModelAttributes,
);
export async function getRates(
  {
    userId,
    pairs,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pairs: ExchangeRatePair[];
  },
  attributes: GenericSequelizeModelAttributes,
);
export async function getRates(
  {
    userId,
    pair,
    pairs,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pair?: ExchangeRatePair;
    pairs?: ExchangeRatePair[];
  },
  attributes: GenericSequelizeModelAttributes,
) {
  const where: Record<string | symbol, unknown> = {
    userId,
  };

  if (pair && pairs) {
    throw new ValidationError({
      message:
        'Only a single parameter is allowed. Passed both "pair" and "pairs".',
    });
  }
  if (!pair && !pairs) {
    throw new ValidationError({
      message: 'One of "pair" or "pairs" parameters is required.',
    });
  }

  if (pair) {
    where.baseCode = pair.baseCode;
    where.quoteCode = pair.quoteCode;
  } else if (pairs) {
    where[Op.or] = pairs.map((item) => ({
      [Op.and]: {
        baseCode: item.baseCode,
        quoteCode: item.quoteCode,
      },
    }));
  }

  return UserExchangeRates.findAll({
    where,
    attributes: { exclude: ['userId'] },
    ...attributes,
  });
}

export type UpdateExchangeRatePair = Pick<
  UserExchangeRatesAttributes,
  'baseCode' | 'quoteCode' | 'rate'
>;

export async function updateRates(
  {
    userId,
    pair,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pair: UpdateExchangeRatePair;
  },
  { transaction }: GenericSequelizeModelAttributes,
): Promise<UserExchangeRates[]>;
export async function updateRates(
  {
    userId,
    pairs,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pairs: UpdateExchangeRatePair[];
  },
  { transaction }: GenericSequelizeModelAttributes,
): Promise<UserExchangeRates[]>;
export async function updateRates(
  {
    userId,
    pair,
    pairs,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pair?: UpdateExchangeRatePair;
    pairs?: UpdateExchangeRatePair[];
  },
  { transaction }: GenericSequelizeModelAttributes,
): Promise<UserExchangeRates[]> {
  const iterations = pairs ?? [pair];
  const returningValues = [];

  for (const pairItem of iterations) {
    const foundItem = await UserExchangeRates.findOne({
      where: {
        userId,
        baseCode: pairItem.baseCode,
        quoteCode: pairItem.quoteCode,
      },
      transaction,
    });

    if (foundItem) {
      const [, updatedItems] = await UserExchangeRates.update(
        {
          rate: pairItem.rate,
        },
        {
          where: {
            userId,
            baseCode: pairItem.baseCode,
            quoteCode: pairItem.quoteCode,
          },
          transaction,
          returning: true,
        },
      );

      returningValues.push(updatedItems[0]);
    } else {
      const currencies = await getCurrencies({
        codes: [pairItem.baseCode, pairItem.quoteCode],
      });
      const baseCurrency = currencies.find(
        (item) => item.code === pairItem.baseCode,
      );
      const quoteCurrency = currencies.find(
        (item) => item.code === pairItem.quoteCode,
      );

      const res = await UserExchangeRates.create(
        {
          userId,
          rate: pairItem.rate,
          baseId: baseCurrency.id,
          baseCode: baseCurrency.code,
          quoteId: quoteCurrency.id,
          quoteCode: quoteCurrency.code,
        },
        {
          transaction,
          returning: true,
        },
      );

      returningValues.push(res);
    }
  }

  return returningValues;
}

export async function removeRates(
  {
    userId,
    pairs,
  }: {
    userId: UserExchangeRatesAttributes['userId'];
    pairs: ExchangeRatePair[];
  },
  { transaction }: GenericSequelizeModelAttributes,
): Promise<void> {
  await UserExchangeRates.destroy({
    where: {
      [Op.or]: pairs.map((item) => ({
        [Op.and]: {
          userId,
          baseCode: item.baseCode,
          quoteCode: item.quoteCode,
        },
      })),
    },
    transaction,
  });
}
