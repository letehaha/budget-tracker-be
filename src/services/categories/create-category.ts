import { withTransaction } from '@services/common/index';
import * as Categories from '@models/Categories.model';

export const createCategory = withTransaction(async (payload: Categories.CreateCategoryPayload) => {
  const result = await Categories.createCategory(payload);

  return result;
});
