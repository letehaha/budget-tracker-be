import { CategoryModel } from 'shared-types';

export type EditCategoryBody = Partial<Pick<CategoryModel, 'name' | 'color' | 'imageUrl'>>;
export type EditCategoryResponse = CategoryModel[];
