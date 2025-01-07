import UserSettings, { type SettingsSchema } from '@models/UserSettings.model';
import { withTransaction } from '../common';

export const updateUserSettings = withTransaction(
  async ({ userId, settings }: { userId: number; settings: SettingsSchema }): Promise<SettingsSchema> => {
    const [existingSettings, created] = await UserSettings.findOrCreate({
      where: { userId },
      defaults: { settings },
    });

    if (!created) {
      existingSettings.settings = settings;
      existingSettings.changed('settings', true);
      await existingSettings.save();
    }

    return existingSettings.settings;
  },
);
