import UserSettings, { type SettingsSchema } from '@models/UserSettings.model';
import Categories from '@models/Categories.model';
import { withTransaction } from '../common';
import { ValidationError } from '@js/errors';

export const updateUserSettings = withTransaction(
  async ({ userId, settings }: { userId: number; settings: SettingsSchema; }): Promise<SettingsSchema> => {
    const excludedCategories = settings.stats?.expenses?.excludedCategories;
    
    if (excludedCategories && excludedCategories.length > 0) {
      const existingCount = await Categories.count({
        where: { id: excludedCategories }
      });

      if (existingCount !== excludedCategories.length) {
        throw new ValidationError({
          message: 'One or more excluded categories not found',
          details: {
            invalidCategories: excludedCategories.filter(async id => 
              !(await Categories.findByPk(id))
            )
          }
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
