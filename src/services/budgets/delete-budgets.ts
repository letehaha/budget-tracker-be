import { withTransaction } from '@services/common/index';
import * as Budgets from '@models/Budget.model';

export const deleteBudget = withTransaction(async ({ id, userId }: { id: number; userId: number }) => {
  const result = await Budgets.deleteBudget({ id, userId });
  return result;
});