import { z } from 'zod'
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as budgetsService from '@root/services/budgets/create-budgets'
import { errorHandler } from '@controllers/helpers';

export const createBudget = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const {
    name,
    start_date,
    end_date,
    auto_include,
    limit_amount,
    category_id,
  }: CreationBudgetParams = req.validated.body;
  
  const params = {
    name,
    userId,
    start_date: start_date ? new Date(start_date) : undefined,
    end_date: end_date ? new Date(end_date) : undefined,
    auto_include,
    limit_amount,
    category_id,
  }

  try {
    const data = await budgetsService.createBudget(params);

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const CreationBudgetPayloadSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'The name must not exceed 200 characters')
      .trim(),
    start_date: z.string().datetime().nullable().optional(),
    end_date: z.string().datetime().nullable().optional(),
    auto_include: z.boolean().optional().default(false), 
    limit_amount: z.number().positive('Limit amount must be positive').nullable().optional(),
    category_id: z.number().int().positive('Category ID must be a positive integer').nullable().optional(),
  })
  .refine(
    (data) => !data.start_date || !data.end_date || data.start_date <= data.end_date,
    {
      message: 'Start date cannot be later than end date',
      path: ['start_date', 'end_date'],
    }
  );

export const createBudgetSchema = z.object({
  body: CreationBudgetPayloadSchema,
});

export type CreationBudgetParams = z.infer<typeof CreationBudgetPayloadSchema>;
  