import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
import { endpointsTypes } from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';
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

export const getUserByToken = async (
  { token, userId }: { token: string, userId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const user = await MonobankUsers.findOne({
    ...attributes,
    where: { apiToken: token, systemUserId: userId },
  });

  return user;
};

export const getUserBySystemId = async (
  { systemUserId }: { systemUserId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const user = await MonobankUsers.findOne({
    where: { systemUserId },
    attributes: ['id', 'clientId', 'name', 'webHookUrl', 'systemUserId', 'apiToken'],
    ...attributes,
  });

  return user;
};

export interface MonoUserUpdatePayload extends endpointsTypes.UpdateMonobankUserBody {
  systemUserId: number;
}
export const updateUser = async (
  { systemUserId, clientId, ...payload }: MonoUserUpdatePayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const where: {
    systemUserId: MonoUserUpdatePayload['systemUserId'];
    clientId?: MonoUserUpdatePayload['clientId'];
  } = { systemUserId }

  if (clientId) {
    where.clientId = clientId
  }

  await MonobankUsers.update(payload, { where, ...attributes });

  const user = await getUserBySystemId(where);

  return user;
};

export const getById = async (
  { id }: { id: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const users = await MonobankUsers.findOne({ where: { id }, ...attributes });

  return users;
};

export interface MonoUserCreationPayload {
  userId: number;
  token: string;
  name?: string;
  clientId: string;
  webHookUrl?: string;
}
export const createUser = async (
  { userId, token, ...payload }: MonoUserCreationPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => {
  await MonobankUsers.create({
    apiToken: token,
    systemUserId: userId,
    ...payload,
  }, attributes);
  const user = await getUserByToken({ token, userId });

  return user;
};
