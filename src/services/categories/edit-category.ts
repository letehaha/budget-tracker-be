import { withTransaction } from '@services/common/index';
import * as Categories from '@models/Categories.model';

export const editCategory = withTransaction(async (payload: Categories.EditCategoryPayload) => {
  const result = await Categories.editCategory(payload);

  return result;
});
