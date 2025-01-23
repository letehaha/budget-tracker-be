import UserSettings from '@models/UserSettings.model';
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
  }): Promise<number[]> => {
    const [existingSettings] = await UserSettings.findOrCreate({
      where: { userId },
      defaults: {
        settings: { 
          stats: {
            expenses: {
              excludedCategories: []
            }
          } 
        },
      },
    });

    const currentExcludedCategories =
      existingSettings.settings.stats.expenses.excludedCategories || [];

    let updatedExcludedCategories = currentExcludedCategories.filter(
      (id) => !removeIds.includes(id),
    );

    updatedExcludedCategories = [
      ...new Set([...updatedExcludedCategories, ...addIds]),
    ];

    existingSettings.settings.stats.expenses.excludedCategories = updatedExcludedCategories;
    existingSettings.changed('settings', true);
    await existingSettings.save();

    return updatedExcludedCategories;
  },
);
