import { expect } from '@jest/globals';
import * as helpers from '@tests/helpers';
import { SettingsSchema } from '@models/UserSettings.model';

describe('Update user settings', () => {
  it('updates empty settings and returns new value right away', async () => {
    const newSettings: SettingsSchema = { stats: { expenses: { excludedCategories: [10] } } };

    const updatedUserSettings = await helpers.updateUserSettings({
      raw: true,
      settings: newSettings,
    });

    expect(updatedUserSettings).toStrictEqual(newSettings);

    const useSettings = await helpers.getUserSettings({ raw: true });

    expect(useSettings).toStrictEqual(newSettings);
  });

  it.each([{ stats: { expenses: { excludedCategories: [20] } } }, { stats: { expenses: { excludedCategories: [] } } }])(
    'overrides existing settings',
    async (newSettings: SettingsSchema) => {
      await helpers.updateUserSettings({
        raw: true,
        settings: { stats: { expenses: { excludedCategories: [10] } } },
      });

      const updatedUserSettings = await helpers.updateUserSettings({
        raw: true,
        settings: newSettings,
      });

      expect(updatedUserSettings).toStrictEqual(newSettings);

      const useSettings = await helpers.getUserSettings({ raw: true });

      expect(useSettings).toStrictEqual(newSettings);
    },
  );

  it('throws error when excluded categories do not exist', async () => {
    const nonExistentCategoryId = 999;
    const newSettings: SettingsSchema = {
      stats: {
        expenses: {
          excludedCategories: [nonExistentCategoryId],
        },
      },
    };

    const updater = await helpers.updateUserSettings({
      settings: newSettings,
    });

    expect(updater.statusCode).toBe(422);
  });

  it('accepts valid category IDs', async () => {
    const category = await helpers.addCustomCategory({ name: 'test', color: '#FF0000', raw: true });
    const newSettings: SettingsSchema = {
      stats: {
        expenses: {
          excludedCategories: [category.id],
        },
      },
    };

    const updatedSettings = await helpers.updateUserSettings({
      raw: true,
      settings: newSettings,
    });

    expect(updatedSettings).toStrictEqual(newSettings);
  });

  it('handles mixed valid and invalid category IDs', async () => {
    const category = await helpers.addCustomCategory({ name: 'test', color: '#FF0000', raw: true });
    const nonExistentId = 999;
    const newSettings: SettingsSchema = {
      stats: {
        expenses: {
          excludedCategories: [category.id, nonExistentId],
        },
      },
    };

    const updater = await helpers.updateUserSettings({
      settings: newSettings,
    });

    expect(updater.statusCode).toBe(422);
  });

  it('handles empty excluded categories array', async () => {
    const newSettings: SettingsSchema = {
      stats: {
        expenses: {
          excludedCategories: [],
        },
      },
    };

    const updatedSettings = await helpers.updateUserSettings({
      raw: true,
      settings: newSettings,
    });

    expect(updatedSettings).toStrictEqual(newSettings);
  });
});
