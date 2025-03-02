import * as Budgets from '@models/Budget.model';
import { withTransaction } from './common';

export const getBudgets = withTransaction(async (payload: { userId: number }) => {
  const result = await Budgets.getBudgets(payload);

  return result;
});
