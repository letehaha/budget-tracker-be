import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as editBudgetService from '@services/budgets/edit-budgets';
import { errorHandler } from '@controllers/helpers';

export const editBudget = async (req, res: CustomResponse) => {
  console.log('editBudget controller: Starting', req.params, req.body, req.user);

  const { id: userId } = req.user || {};
  const { id: budgetId } = req.params;
  const { name, transactionIds } = req.body;

  if (!budgetId || isNaN(Number(budgetId)) || Number(budgetId) <= 0) {
    return res.status(400).json({
      status: API_RESPONSE_STATUS.error,
      response: { message: 'Invalid or missing budget ID', code: 'INVALID_ID' },
    });
  }

  if (!userId) {
    return res.status(401).json({
      status: API_RESPONSE_STATUS.error,
      response: { message: 'User not authenticated', code: 'UNAUTHENTICATED' },
    });
  }

  const id = Number(budgetId);

  try {
    const result = await editBudgetService.editBudgets({
      id,
      userId,
      name,
      transactionIds,
    });
    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const paramsZodSchema = z.object({
  id: z
    .string()
    .transform(val => Number(val))
    .refine(val => !isNaN(val) && val > 0, { message: 'ID must be a positive number' }),
});

const editBudgetParamsSchema = z.object({
  params: paramsZodSchema,
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters').trim().optional(),
    transactionIds: z.union([
      z.number().int().positive('Transaction ID must be a positive integer'),
      z.array(z.number().int().positive('Each transaction ID must be a positive integer')).max(10, 'Maximum 10 transactions allowed'),
    ]).optional(),
  }),
});

export const editBudgetSchema = editBudgetParamsSchema;