import UserSettings, { type SettingsSchema } from '@models/UserSettings.model';
import Categories from '@models/Categories.model';
import { withTransaction } from '../common';
import { ValidationError } from '@js/errors';

export const updateUserSettings = withTransaction(
  async ({ userId, settings }: { userId: number; settings: SettingsSchema }): Promise<SettingsSchema> => {
    const excludedCategories = settings.stats?.expenses?.excludedCategories;

    if (excludedCategories?.length) {
      const existingCategories = await Categories.findAll({
        where: { id: excludedCategories },
        attributes: ['id'],
      });

      if (existingCategories.length !== excludedCategories.length) {
        const existingIds = new Set(existingCategories.map((cat) => cat.id));
        throw new ValidationError({
          message: 'One or more excluded categories not found',
          details: {
            invalidCategories: excludedCategories.filter((id) => !existingIds.has(id)),
          },
        });
      }
    }

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
