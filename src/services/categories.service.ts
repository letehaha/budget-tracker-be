import { Transaction } from 'sequelize/types';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';

export const bulkCreate = (
  { data }: { data: unknown },
  {
    transaction,
    validate,
    returning,
  }: {
    transaction: Transaction;
    validate?: boolean;
    returning?: boolean;
  },
) => {
  return Categories.bulkCreate({ data }, { transaction, validate, returning });
};

export const getCategories = async (
  payload: { userId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const result = await Categories.getCategories(payload);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};
