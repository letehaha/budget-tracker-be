import { withTransaction } from '@services/common/index';
import * as Budgets from '@models/Budget.model';
import Transactions, { findWithFilters } from '@models/Transactions.model';

const cleanPayload = <T extends object>(data: T): T => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) =>
      value === undefined ? [key, null] : [key, value]
    )
  ) as T;
};

const prepareTransactionFilters = (payload: Budgets.CreateBudgetPayload) => ({
  userId: payload.userId,
  startDate: payload.start_date?.toISOString(),
  endDate: payload.end_date?.toISOString(),
  categoryId: payload.category_id || undefined,
});

export const createBudget = withTransaction(async (payload: Budgets.CreateBudgetPayload) => {
  if (!payload.name || !payload.userId) {
    throw new Error('Name and userId are required fields');
  }

  if (payload.start_date && payload.end_date && payload.start_date > payload.end_date) {
    throw new Error('Start date cannot be later than end date');
  }

  const budgetData = cleanPayload({
    name: payload.name,
    userId: payload.userId,
    start_date: payload.start_date,
    end_date: payload.end_date,
    auto_include: payload.auto_include ?? false,
    limit_amount: payload.limit_amount,
    category_id: payload.category_id,
  });

  const budget = await Budgets.createBudget(budgetData);

  let transactions: Transactions[] = [];
  if (payload.auto_include && payload.start_date && payload.end_date) {
    const transactionFilters = prepareTransactionFilters(payload);
    transactions = await findWithFilters({
      ...transactionFilters,
      from: 0,
      isRaw: false,
    });

    if (transactions.length) {
      await budget.setTransactions(transactions);
    }
  }

  const budgetResponse = {
    ...budget.toJSON(),
    transactions: transactions.length > 0 ? transactions.map(t => t.toJSON()) : [],
  };

  return budgetResponse;
});