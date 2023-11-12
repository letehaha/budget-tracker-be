import { MonobankUserModel } from 'shared-types';
import * as MonobankUsers from '@models/banks/monobank/Users.model';
import { GenericSequelizeModelAttributes } from '@common/types';

export const getUserById = async (
  { id },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => MonobankUsers.getById({ id }, attributes);

export const getUserByToken = async (
  { token, userId }: { token: string; userId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> =>
  MonobankUsers.getUserByToken({ token, userId }, attributes);

export const createUser = async (
  payload: MonobankUsers.MonoUserCreationPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => MonobankUsers.createUser(payload, attributes);

export const getUserBySystemId = async (
  { systemUserId }: { systemUserId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> =>
  MonobankUsers.getUserBySystemId({ systemUserId }, attributes);

export const updateUser = async (
  payload: MonobankUsers.MonoUserUpdatePayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankUserModel> => MonobankUsers.updateUser(payload, attributes);
