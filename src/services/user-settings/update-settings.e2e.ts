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

  it.todo('ignores setting non-existing categories');
});
