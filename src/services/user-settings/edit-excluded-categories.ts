import UserSettings, { type SettingsSchema } from '@models/UserSettings.model';
import { withTransaction } from '../common';

export const editExcludedCategories = withTransaction(
  async ({
    userId,
    addIds = [],
    removeIds = [],
  }: {
    userId: number;
    addIds?: number[];
    removeIds?: number[];
  }): Promise<SettingsSchema> => {
    const [existingSettings] = await UserSettings.findOrCreate({
      where: { userId },
      defaults: {
        settings: { stats: { expenses: { excludedCategories: [] } } },
      },
    });

    const currentExcludedCategories =
      existingSettings.settings.stats.expenses.excludedCategories || [];

    const updatedExcludedCategories = currentExcludedCategories
      .filter((id) => !removeIds.includes(id))
      .concat(addIds.filter((id) => !currentExcludedCategories.includes(id)));

    existingSettings.settings.stats.expenses.excludedCategories = updatedExcludedCategories;

    existingSettings.changed('settings', true);
    await existingSettings.save();

    return existingSettings.settings;
  },
);
