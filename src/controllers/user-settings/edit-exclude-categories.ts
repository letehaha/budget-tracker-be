import { API_RESPONSE_STATUS } from 'shared-types';
import { z } from 'zod';
import { editExcludedCategories } from '@services/user-settings/edit-excluded-categories';
import { errorHandler } from '@controllers/helpers';
import { CustomResponse } from '@common/types';

export const editExcludedCategoriesHandler = async (
  req, res: CustomResponse,
) => {
  try {
    const { addIds, removeIds } = editExcludedCategoriesSchema.parse(req.body);
    const { user } = req;

    const updatedSettings = await editExcludedCategories({
      userId: user?.id,
      addIds,
      removeIds,
    });

    res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: updatedSettings,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

const editExcludedCategoriesSchema = z.object({
  addIds: z.array(z.number().int().positive().finite()).optional().default([]),
  removeIds: z.array(z.number().int().positive().finite()).optional().default([]),
});
