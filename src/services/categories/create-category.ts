import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';

export const createCategory = async (
  payload: Categories.CreateCategoryPayload,
  { transaction }: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const result = await Categories.createCategory(payload);

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
