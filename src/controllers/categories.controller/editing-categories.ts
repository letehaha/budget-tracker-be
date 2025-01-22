import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import * as CategoriesService from '@services/categories/editing-categories';
import { errorHandler } from '@controllers/helpers';
import { CustomResponse } from '@common/types';

export const editCategories = async (req, res: CustomResponse) => {
  try {
    const { userId } = req.body;
    const { addIds, removeIds } = req.body;

    if (!Array.isArray(addIds) || !Array.isArray(removeIds)) {
      return res.status(400).json({
        status: API_RESPONSE_STATUS.success,
      });
    }

    const data = await CategoriesService.editCategories({ userId, addIds, removeIds });
    res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

export const editCategoriesSchema = z.object({
  addIds: z.array(z.number()).default([]),
  removeIds: z.array(z.number()).default([]),
});