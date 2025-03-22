import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { editBudgetService } from '@services/budgets/edit-budget';
import { errorHandler } from '@controllers/helpers';
import { recordArrayIds, recordId } from '@common/lib/zod/custom-types';

export const editBudget = async (req, res: CustomResponse) => {
  const { id: userId } = req.user || {};
  const { id: budgetId }: z.infer<typeof paramsSchema> = req.validated.params;
  const { name }: z.infer<typeof bodySchema> = req.validated.body;

  try {
    const result = await editBudgetService({
      id: budgetId,
      userId,
      name,
    });
    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const paramsSchema = z.object({
  id: recordId(),
});

const bodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters').trim().optional(),
  transactionIds: recordArrayIds().optional(),
});

const editBudgetParamsSchema = z.object({
  params: paramsSchema,
  body: bodySchema,
});

export const editBudgetSchema = editBudgetParamsSchema;
