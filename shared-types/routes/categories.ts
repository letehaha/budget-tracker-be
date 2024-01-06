import { CategoryModel } from 'shared-types';

export type CreateCategoryBody = {
  name: CategoryModel['name'];
  color: CategoryModel['color'];
  imageUrl: CategoryModel['imageUrl'];
  parentId?: CategoryModel['parentId'];
};
export type CreateCategoryResponse = CategoryModel;

export type EditCategoryBody = Partial<
  Pick<CategoryModel, 'name' | 'color' | 'imageUrl'>
>;
export type EditCategoryResponse = CategoryModel[];
