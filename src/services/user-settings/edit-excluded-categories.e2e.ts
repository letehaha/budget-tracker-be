import { expect } from '@jest/globals';
// import * as helpers from '@tests/helpers';
import UserSettings, { DEFAULT_SETTINGS } from '@models/UserSettings.model';
import { editExcludedCategories } from '@services/user-settings/edit-excluded-categories';

jest.mock('@models/UserSettings.model', () => ({
  findOrCreate: jest.fn(),
}));

describe('editExcludedCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user settings with default values if none exist', async () => {
    const userId = 1;

    (UserSettings.findOrCreate as jest.Mock).mockResolvedValue([
      {
        settings: DEFAULT_SETTINGS,
        changed: jest.fn(),
        save: jest.fn(),
      },
    ]);

    const result = await editExcludedCategories({ userId });

    expect(UserSettings.findOrCreate).toHaveBeenCalledWith({
      where: { userId },
      defaults: { settings: DEFAULT_SETTINGS },
    });

    expect(result).toEqual([]);
  });

  it('adds new excludedCategories to the user settings', async () => {
    const userId = 2;
    const existingCategories = [1, 2];
    const addIds = [3, 4];

    const mockSave = jest.fn();
    (UserSettings.findOrCreate as jest.Mock).mockResolvedValue([
      {
        settings: {
          stats: {
            expenses: {
              excludedCategories: existingCategories,
            },
          },
        },
        changed: jest.fn(),
        save: mockSave,
      },
    ]);

    const result = await editExcludedCategories({ userId, addIds });

    expect(result).toEqual([1, 2, 3, 4]);
    expect(mockSave).toHaveBeenCalled();
  });

  it('removes specified excludedCategories from the user settings', async () => {
    const userId = 3;
    const existingCategories = [1, 2, 3];
    const removeIds = [2];

    const mockSave = jest.fn();
    (UserSettings.findOrCreate as jest.Mock).mockResolvedValue([
      {
        settings: {
          stats: {
            expenses: {
              excludedCategories: existingCategories,
            },
          },
        },
        changed: jest.fn(),
        save: mockSave,
      },
    ]);

    const result = await editExcludedCategories({ userId, removeIds });

    expect(result).toEqual([1, 3]);
    expect(mockSave).toHaveBeenCalled();
  });

  it('handles adding and removing categories simultaneously', async () => {
    const userId = 4;
    const existingCategories = [1, 2, 3];
    const addIds = [4];
    const removeIds = [2];

    const mockSave = jest.fn();
    (UserSettings.findOrCreate as jest.Mock).mockResolvedValue([
      {
        settings: {
          stats: {
            expenses: {
              excludedCategories: existingCategories,
            },
          },
        },
        changed: jest.fn(),
        save: mockSave,
      },
    ]);

    const result = await editExcludedCategories({ userId, addIds, removeIds });

    expect(result).toEqual([1, 3, 4]);
    expect(mockSave).toHaveBeenCalled();
  });

  it('returns unchanged excludedCategories when no addIds or removeIds are provided', async () => {
    const userId = 5;
    const existingCategories = [1, 2, 3];

    const mockSave = jest.fn();
    (UserSettings.findOrCreate as jest.Mock).mockResolvedValue([
      {
        settings: {
          stats: {
            expenses: {
              excludedCategories: existingCategories,
            },
          },
        },
        changed: jest.fn(),
        save: mockSave,
      },
    ]);

    const result = await editExcludedCategories({ userId });

    expect(result).toEqual(existingCategories); // Nothing is added or removed
    expect(mockSave).toHaveBeenCalled();
  });
});