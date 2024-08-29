import * as helpers from '@tests/helpers';
import { CategoryModel } from '../../../shared-types/models';

export const addCustomCategory = async ({
  parentId,
  name,
}: {
  parentId: number;
  name: string;
}): Promise<CategoryModel> => {
  const result = await helpers.makeRequest({
    method: 'post',
    url: '/categories',
    payload: {
      parentId,
      name,
    },
    raw: true,
  });

  return result;
};
export const getCategoriesList = async (): Promise<CategoryModel[]> => {
  const result = await helpers.makeRequest({
    method: 'get',
    url: '/categories',
    raw: true,
  });

  return result;
};
