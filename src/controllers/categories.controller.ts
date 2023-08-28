import { API_RESPONSE_STATUS, API_ERROR_CODES, CategoryModel } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as Categories from '@models/Categories.model';

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
  const { id } = req.user;
  const {
    name,
    imageUrl,
    color,
    type,
    parentId,
  } = req.body;

  try {
    const data = await Categories.createCategory({
      name,
      imageUrl,
      color,
      type,
      parentId,
      userId: id,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    if (err.code === API_ERROR_CODES.validationError) {
      return res.status(500).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: err.message,
          code: API_ERROR_CODES.validationError,
        },
      });
    }
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};
