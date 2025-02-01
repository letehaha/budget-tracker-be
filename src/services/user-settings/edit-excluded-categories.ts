import UserSettings, { DEFAULT_SETTINGS } from '@models/UserSettings.model';
import { withTransaction } from '../common';

export const editExcludedCategories = withTransaction(
  async ({
    userId,
    addIds,
    removeIds,
  }: {
    userId: number;
    addIds?: number[];
    removeIds?: number[];
  }): Promise<number[]> => {
    console.log("addIds: ", addIds)
    const [existingSettings] = await UserSettings.findOrCreate({
      where: { userId },
      defaults: {
        settings: DEFAULT_SETTINGS,
      },
    });

    let currentExcludedCategories =
      existingSettings.settings.stats.expenses.excludedCategories || [];

    currentExcludedCategories = currentExcludedCategories.filter(
      (id) => !removeIds?.includes(id),
    );

    const add = addIds?.length ? addIds : []

    currentExcludedCategories = [
      ...new Set([...currentExcludedCategories, ...add]),
    ];

    existingSettings.settings.stats.expenses.excludedCategories = currentExcludedCategories;
    existingSettings.changed('settings', true);
    await existingSettings.save();

    console.log('Updated excluded categories:', currentExcludedCategories);

    return currentExcludedCategories;
  },
);