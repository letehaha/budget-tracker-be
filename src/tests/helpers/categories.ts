import { Response } from 'express';
import * as helpers from '@tests/helpers';
import { CategoryModel } from '../../../shared-types/models';

interface BaseCreationPayload {
  parentId?: number;
  name?: string;
  color?: string;
}
export async function addCustomCategory({
  raw,
  ...params
}: BaseCreationPayload & { raw?: false }): Promise<Response>;
export async function addCustomCategory({
  raw,
  ...params
}: BaseCreationPayload & { raw?: true }): Promise<CategoryModel>;
export async function addCustomCategory({
  parentId,
  name,
  color,
  raw = true,
}: BaseCreationPayload & {
  raw?: boolean;
} = {}): Promise<Response | CategoryModel> {
  const result = await helpers.makeRequest({
    method: 'post',
    url: '/categories',
    payload: {
      parentId,
      name,
      color,
    },
    raw,
  });

  return result;
}

export const getCategoriesList = async (): Promise<CategoryModel[]> => {
  const result = await helpers.makeRequest({
    method: 'get',
    url: '/categories',
    raw: true,
  });

  return result;
};
