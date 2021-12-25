import {
  Table,
  Column,
  Model,
  ForeignKey,
  Length,
} from 'sequelize-typescript';
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

export const getUserByToken = async ({ token, userId }) => {
  const user = await MonobankUsers.findOne({
    where: { apiToken: token, systemUserId: userId },
  });

  return user;
};

export const getUser = async ({ systemUserId }) => {
  const user = await MonobankUsers.findOne({
    where: { systemUserId },
    attributes: ['id', 'clientId', 'name', 'webHookUrl', 'systemUserId', 'apiToken'],
  });

  return user;
};

export const updateUser = async ({
  systemUserId,
  apiToken,
  name,
}: {
  systemUserId: number;
  apiToken?: string;
  name?: string;
}) => {
  const where = { systemUserId };

  await MonobankUsers.update(
    {
      apiToken,
      name,
    },
    { where },
  );

  const user = await getUser(where);

  return user;
};

export const getById = async ({ id }) => {
  const users = await MonobankUsers.findOne({ where: { id } });

  return users;
};

export const createUser = async ({
  userId,
  token,
  name,
  clientId,
  webHookUrl,
}) => {
  await MonobankUsers.create({
    apiToken: token,
    clientId,
    name,
    webHookUrl,
    systemUserId: userId,
  });
  const user = await getUserByToken({ token, userId });

  return user;
};

export const updateWebhook = async ({
  webHookUrl,
  clientId,
  systemUserId,
}) => {
  const result = await MonobankUsers.update(
    { webHookUrl },
    { where: { clientId, systemUserId } },
  );

  return result;
};
