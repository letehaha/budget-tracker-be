import { Table, Column, Model, ForeignKey, Length } from 'sequelize-typescript';
import { endpointsTypes } from 'shared-types';
import Users from '../../Users.model';

@Table({
  timestamps: true,
})
export default class MonobankUsers extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  clientId: string;

  @Column({ allowNull: false })
  name: string;

  @Length({ max: 1000 })
  @Column({ allowNull: true })
  webHookUrl: string;

  @Column({ allowNull: false })
  apiToken: string;

  @ForeignKey(() => Users)
  @Column({ allowNull: false })
  systemUserId: number;
}

export const getUserByToken = async ({ token, userId }: { token: string; userId: number }) => {
  const user = await MonobankUsers.findOne({
    where: { apiToken: token, systemUserId: userId },
    raw: true,
  });

  return user;
};

export const getUserBySystemId = async ({ systemUserId }: { systemUserId: number }) => {
  const user = await MonobankUsers.findOne({
    where: { systemUserId },
    attributes: ['id', 'clientId', 'name', 'webHookUrl', 'systemUserId', 'apiToken'],
  });

  return user;
};

export interface MonoUserUpdatePayload extends endpointsTypes.UpdateMonobankUserBody {
  systemUserId: number;
}
export const updateUser = async ({ systemUserId, clientId, ...payload }: MonoUserUpdatePayload) => {
  const where: {
    systemUserId: MonoUserUpdatePayload['systemUserId'];
    clientId?: MonoUserUpdatePayload['clientId'];
  } = { systemUserId };

  if (clientId) {
    where.clientId = clientId;
  }

  await MonobankUsers.update(payload, { where });

  const user = await getUserBySystemId(where);

  return user;
};

export const getById = async ({ id }: { id: number }) => {
  const users = await MonobankUsers.findOne({ where: { id } });

  return users;
};

export interface MonoUserCreationPayload {
  userId: number;
  token: string;
  name?: string;
  clientId: string;
  webHookUrl?: string;
}
export const createUser = async ({ userId, token, ...payload }: MonoUserCreationPayload) => {
  await MonobankUsers.create({
    apiToken: token,
    systemUserId: userId,
    ...payload,
  });

  const user = await getUserByToken({ token, userId });

  return user;
};
