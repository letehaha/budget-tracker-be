import { API_RESPONSE_STATUS, API_ERROR_CODES, CategoryModel, endpointsTypes } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as Categories from '@models/Categories.model';
import * as categoriesService from '@services/categories.service';
import { errorHandler } from './helpers';

// TODO: test it
export const buildCategiesObjectGraph = (items: Categories.default[]): CategoryModel[] => {
  const itemsById: Record<string, CategoryModel> = {};
  const roots = [];
  const tempItems: CategoryModel[] = items.map(item => {
    const tempItem = {
      ...item,
      subCategories: [],
    }
    // build an id->object mapping, so we don't have to go hunting for parents
    itemsById[item.id] = tempItem;

    return tempItem
  })

  tempItems.forEach((item) => {
    const { parentId } = item;
    // if parentId is null, this is a root; otherwise, it's parentId's kid
    const nodes = !parentId ? roots : itemsById[parentId].subCategories;
    nodes.push(item);
  });

  return roots;
};

export const getCategories = async (req, res: CustomResponse) => {
  const { id } = req.user;
  const { rawCategories } = req.query;

  try {
    const data = await Categories.getCategories({ userId: id });

    if (rawCategories !== undefined) {
      return res.status(200).json({
        status: API_RESPONSE_STATUS.success,
        response: data,
      });
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: buildCategiesObjectGraph(data),
    });
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const createCategory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const {
    name,
    imageUrl,
    color,
    parentId,
  }: endpointsTypes.CreateCategoryBody = req.body;

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
  const {
    name,
    imageUrl,
    color,
  }: endpointsTypes.EditCategoryBody = req.body;

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
}

// TODO: Delete category
// When deleting, make all transactions related to that category being related
// to parentId if exists. If no parent, then to Other category (or maybe create Unknown)
// Disallow deleting parent if children exist (for now)
