import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import * as Categories from '@models/Categories.model';
import { NotFoundError, ValidationError } from '@js/errors';
import Transactions from '@models/Transactions.model';

export const deleteCategory = async (
  payload: Categories.DeleteCategoryPayload,
  { transaction }: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const rootCategory = await Categories.default.findOne({
      where: { id: payload.categoryId },
      transaction,
    });

    if (!rootCategory) {
      throw new NotFoundError({
        message: 'Category with provided id does not exist.',
      });
    }

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
          'You cannot delete category that has any transactions linked. You need to delete or change category of all linked transactions.',
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
