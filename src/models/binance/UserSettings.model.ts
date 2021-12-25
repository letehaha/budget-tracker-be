import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import Users from '../Users.model';

@Table({
  timestamps: false,
})
export default class BinanceUserSettings extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  apiKey: string;

  @Column({ allowNull: false })
  secretKey: string;

  @ForeignKey(() => Users)
  @Column({ allowNull: false })
  userId: number;
}

export const getByUserId = async ({ userId }) => {
  const mcc = await BinanceUserSettings.findOne({
    where: { userId },
  });

  return mcc;
};

export const addSettings = async ({
  apiKey,
  secretKey,
  userId,
}: {
  apiKey?: string;
  secretKey?: string;
  userId: number;
}) => {
  const settingsData: Record<string, string> = {};

  if (apiKey) settingsData.apiKey = apiKey;
  if (secretKey) settingsData.secretKey = secretKey;

  let userSettings: BinanceUserSettings[] | BinanceUserSettings = await BinanceUserSettings.findOne({ where: { userId } });

  if (userSettings) {
    const result = await BinanceUserSettings.update(settingsData, {
      where: { userId },
      returning: true,
    });
    if (result[1]) {
      // eslint-disable-next-line prefer-destructuring
      userSettings = result[1];
    }
  } else {
    userSettings = await BinanceUserSettings.create({
      ...settingsData,
      userId,
    });
  }

  return userSettings;
};
