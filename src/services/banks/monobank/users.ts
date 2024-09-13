import { MonobankUserModel } from 'shared-types';
import * as MonobankUsers from '@models/banks/monobank/Users.model';
import { withTransaction } from '@root/services/common';

export const getUserById = withTransaction(
  async ({ id }): Promise<MonobankUserModel> => MonobankUsers.getById({ id }),
);

export const getUserByToken = withTransaction(
  async ({ token, userId }: { token: string; userId: number }): Promise<MonobankUserModel> =>
    MonobankUsers.getUserByToken({ token, userId }),
);

export const createUser = withTransaction(
  async (payload: MonobankUsers.MonoUserCreationPayload): Promise<MonobankUserModel> =>
    MonobankUsers.createUser(payload),
);

export const getUserBySystemId = withTransaction(
  async ({ systemUserId }: { systemUserId: number }): Promise<MonobankUserModel> =>
    MonobankUsers.getUserBySystemId({ systemUserId }),
);

export const updateUser = withTransaction(
  async (payload: MonobankUsers.MonoUserUpdatePayload): Promise<MonobankUserModel> =>
    MonobankUsers.updateUser(payload),
);
