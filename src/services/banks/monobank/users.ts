import { MonobankUserModel } from 'shared-types';
import * as MonobankUsers from '@models/banks/monobank/Users.model';
import { GenericSequelizeModelAttributes } from '@common/types';


export const getUserById = async (
  { id },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => {
  const user = await MonobankUsers.getById(
    { id },
    attributes,
  );

  return user;
}

export const getUserByToken = async (
  { token, userId }: { token: string, userId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => {
  const user = await MonobankUsers.getUserByToken(
    { token, userId },
    attributes,
  );

  return user;
}

export const createUser = async (
  payload: MonobankUsers.MonoUserCreationPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => {
  const user = await MonobankUsers.createUser(payload, attributes);

  return user;
}

export const getUserBySystemId = async (
  { systemUserId }: { systemUserId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => {
  const user = await MonobankUsers.getUserBySystemId({ systemUserId }, attributes);

  return user;
}

export const updateUser = async (
  payload: MonobankUsers.MonoUserUpdatePayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => {
  const user = await MonobankUsers.updateUser(payload, attributes);

  return user;
}
