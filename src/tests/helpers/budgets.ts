// tests/helpers/budget-helpers.ts
import { makeRequest } from './common';
import * as budgetService from '@root/services/budgets/create-budget';
import { BudgetModel } from 'shared-types';

// type omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface TestCreateBudgetPayload {
  id?: number;
  userId: number;
  name: string;
  status?: string;
  categoryName?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null; 
  autoInclude?: boolean;
  limitAmount?: number | null;
}

export async function createCustomBudget<R extends boolean | undefined = undefined>({
  raw,
  ...payload
}: TestCreateBudgetPayload & { raw?: R }) {
  return makeRequest<Awaited<ReturnType<typeof budgetService.createBudget>>, R>({
    method: 'post',
    url: '/budgets',
    payload,
    raw,
  });
}

export async function getCustomBudgets<R extends boolean | undefined = undefined>({
  raw,
}: {
  raw?: R;
} = {}) {
  return makeRequest<BudgetModel[], R>({
    method: 'get',
    url: '/budgets',
    raw,
  });
}

export async function getCustomBudgetById<R extends boolean | undefined = undefined>({
  id,
  raw,
}: {
  id: number;
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof budgetService.createBudget>> | null, R>({
    method: 'get',
    url: `/budgets/${id}`,
    raw,
  });
}

export async function deleteCustomBudget<R extends boolean | undefined = undefined>({
  id,
  raw,
}: {
  id: number;
  raw?: R;
}) {
  return makeRequest<{ success: boolean }, R>({
    method: 'delete',
    url: `/budgets/${id}`,
    raw,
  });
}