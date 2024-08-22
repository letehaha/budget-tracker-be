import { API_RESPONSE_STATUS, endpointsTypes } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as categoriesService from '@services/categories.service';
import { errorHandler } from './helpers';

export const getCategories = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  try {
    const data = await categoriesService.getCategories({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const createCategory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { name, imageUrl, color, parentId }: endpointsTypes.CreateCategoryBody = req.body;

  try {
    const data = await categoriesService.createCategory({
      name,
      imageUrl,
      color,
      parentId,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const editCategory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { id: categoryId } = req.params;
  const { name, imageUrl, color }: endpointsTypes.EditCategoryBody = req.body;

  try {
    const data = await categoriesService.editCategory({
      categoryId,
      userId,
      name,
      imageUrl,
      color,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const deleteCategory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { id: categoryId } = req.params;

  try {
    await categoriesService.deleteCategory({
      categoryId,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
