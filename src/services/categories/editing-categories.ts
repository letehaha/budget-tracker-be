import Categories from '@models/Categories.model';
import { ValidationError, NotFoundError } from '@js/errors';

export const editCategories = async ({
  userId,
  addIds = [],
  removeIds = [],
}: {
  userId: number;
  addIds?: number[];
  removeIds?: number[];
}) => {
  const addedCategories: number[] = [];
  for (const id of addIds) {
    const existingCategory = await Categories.findOne({
      where: { userId, id },
      raw: true,
    });

    if (existingCategory) {
      throw new ValidationError({
        message: `Category with ID ${id} already exists in the user settings.`,
      });
    }

    const added = await Categories.create({ id, userId }, { validate: true });
    addedCategories.push(added.id);
  }

  const removedCategories: number[] = [];
  for (const id of removeIds) {
    const existingCategory = await Categories.findOne({
      where: { userId, id },
      raw: true,
    });

    if (!existingCategory) {
      throw new NotFoundError({
        message: `Category with ID ${id} not found in the user settings.`,
      });
    }

    await Categories.destroy({ where: { userId, id } });
    removedCategories.push(id);
  }

  return { added: addedCategories, removed: removedCategories };
};
