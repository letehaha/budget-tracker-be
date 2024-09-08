import { Transaction } from 'sequelize/types';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';
import { ValidationError } from '@js/errors';
import Transactions from '@models/Transactions.model';

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

export const editCategory = async (
  payload: Categories.EditCategoryPayload,
  { transaction }: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const result = await Categories.editCategory(payload);

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

export const deleteCategory = async (
  payload: Categories.DeleteCategoryPayload,
  { transaction }: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const parentCategory = await Categories.default.findOne({
      where: { parentId: payload.categoryId },
      transaction,
    });

    if (parentCategory) {
      throw new ValidationError({
        message:
          'For now you cannot delete category that is a parent for any subcategory. You need to delete all its subcategories first.',
      });
    }

    const relatedTransaction = await Transactions.findOne({
      where: {
        userId: payload.userId,
        categoryId: payload.categoryId,
      },
      transaction,
    });

    if (relatedTransaction) {
      throw new ValidationError({
        message:
          'For now you cannot delete category that has any transactions linked. You need to delete or change category of all linked transactions.',
      });
    }

    // When deleting, make all transactions related to that category being related
    // to parentId if exists. If no parent, then to Other category (or maybe create Unknown)
    // Disallow deleting parent if children exist (for now)
    await Categories.deleteCategory(payload);

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
};
