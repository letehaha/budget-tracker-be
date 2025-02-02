import { withTransaction } from '@services/common/index';
import * as Categories from '@models/Categories.model';
import { NotFoundError, ValidationError } from '@js/errors';
import Transactions from '@models/Transactions.model';
import UserSettings from '@models/UserSettings.model';

export const deleteCategory = withTransaction(async (payload: Categories.DeleteCategoryPayload) => {
  const rootCategory = await Categories.default.findOne({
    where: { id: payload.categoryId },
  });

  if (!rootCategory) {
    throw new NotFoundError({
      message: 'Category with provided id does not exist.',
    });
  }

  const parentCategory = await Categories.default.findOne({
    where: { parentId: payload.categoryId },
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
  });

  if (relatedTransaction) {
    throw new ValidationError({
      message:
        'You cannot delete category that has any transactions linked. You need to delete or change category of all linked transactions.',
    });
  }

  const userSettings = await UserSettings.findAll();

  for (const settings of userSettings) {
    const excludedCategories = settings.settings.stats.expenses.excludedCategories || [];
    if (excludedCategories.includes(payload.categoryId)) {
      settings.settings.stats.expenses.excludedCategories = excludedCategories.filter(
        (id) => id !== payload.categoryId
      );
      await settings.save();
    }
  }

  // When deleting, make all transactions related to that category being related
  // to parentId if exists. If no parent, then to Other category (or maybe create Unknown)
  // Disallow deleting parent if children exist (for now)
  await Categories.deleteCategory(payload);
});
