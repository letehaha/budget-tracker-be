import { API_RESPONSE_STATUS } from 'shared-types';
import { z } from 'zod';
import { recordId } from '@common/lib/zod/custom-types';
import { editExcludedCategories } from '@services/user-settings/edit-excluded-categories';
import { errorHandler } from '@controllers/helpers';
import { CustomResponse } from '@common/types';

export const editExcludedCategoriesHandler = async (
  req,
  res: CustomResponse
) => {
  try {
    const { addIds, removeIds } = req.validated; 
    const { user } = req;

    const updatedCategories = await editExcludedCategories({
      userId: user.id,
      addIds,
      removeIds,
    });

    res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: updatedCategories,
    });
  } catch (error) {
    errorHandler(res,error);
  }
};

export const editExcludedCategoriesSchema = z.object({
  addIds: z.array(recordId()).optional().default([]),
  removeIds: z.array(recordId()).optional().default([]),
});